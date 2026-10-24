import type Stripe from "stripe";
import { notifyNewOrder } from "@/lib/notifications/notify";
import { getOrder } from "@/lib/orders";
import { formatPence } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/supabase/admin";

/**
 * Stripe webhook. Configure in the Stripe dashboard (or `stripe listen`) for:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired
 *
 * Idempotent: an order only moves pending → paid once (a conditional UPDATE), and
 * notifications are only sent by the request that made that change. Stripe retries
 * are therefore safe.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const db = getAdminDb();
  if (!stripe || !secret || !db) {
    console.error("Stripe webhook called but Stripe/Supabase env vars are missing");
    return new Response("Not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // Signature verification needs the exact raw body.
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.warn("Stripe webhook signature check failed", err instanceof Error ? err.message : err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        // Bank-redirect methods can complete before the money arrives; wait for async_payment_succeeded.
        if (session.payment_status !== "paid") break;
        await markPaid(db, session);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          await db
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId)
            .eq("stripe_session_id", session.id)
            .eq("status", "pending");
        }
        break;
      }
      default:
        // Other events are acknowledged and ignored.
        break;
    }
  } catch (err) {
    // 500 → Stripe retries later. Safe because of the conditional update above.
    console.error(`Stripe webhook ${event.type} (${event.id}) failed`, err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}

async function markPaid(db: NonNullable<ReturnType<typeof getAdminDb>>, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.warn(`Checkout session ${session.id} has no order_id metadata`);
    return;
  }

  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  // Conditional update = idempotency: only the first delivery of this event flips the status.
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent: paymentIntent })
    .eq("id", orderId)
    .eq("stripe_session_id", session.id)
    .in("status", ["pending", "cancelled"]) // a late payment on an expired session still counts
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Failed to mark order ${orderId} paid: ${error.message}`);
  if (!updated) return; // already processed (Stripe retry) or session/order mismatch

  const order = await getOrder(db, orderId);
  if (!order) throw new Error(`Order ${orderId} vanished after being marked paid`);

  // Belt and braces: the amount Stripe charged should match what we saved.
  const charged = session.amount_total ?? 0;
  const warning =
    charged !== order.totalPence || session.currency !== "gbp"
      ? `Stripe charged ${formatPence(charged)} ${session.currency?.toUpperCase()} but the order total is ${formatPence(order.totalPence)}. Check Stripe before preparing.`
      : undefined;
  if (warning) console.error(`[order #${order.number}] ${warning}`);

  await notifyNewOrder(order, { warning });
}
