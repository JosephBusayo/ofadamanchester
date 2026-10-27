"use server";

import { headers } from "next/headers";
import { checkoutSchema, cartSchema, type CheckoutInput, type FieldErrors } from "@/lib/checkout-schema";
import { normalisePostcode, quoteDelivery, roadDistanceKm, type FeeLine } from "@/lib/delivery";
import { getMenu } from "@/lib/menu/get-menu";
import { getKitchenLocation, lookupPostcode } from "@/lib/postcodes";
import { formatPence, orderTotals, priceCart, unavailableLines, type CartLineInput } from "@/lib/pricing";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatSlot, formatTime, isValidSlot } from "@/lib/schedule";
import { getSettings } from "@/lib/settings";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/supabase/admin";
import { isRainForecast } from "@/lib/weather";

export type QuoteResult =
  | { ok: true; postcode: string; distanceKm: number; feePence: number; breakdown: FeeLine[] }
  | { ok: false; message: string; whatsapp?: boolean };

const NOT_COVERED = "We don't deliver to that postcode online yet — message us on WhatsApp and we'll sort delivery for you.";

/** Delivery fee for a postcode and time slot. Re-run server-side at checkout, so this is display only. */
export async function quoteDeliveryAction(postcodeInput: string, lines: CartLineInput[], slot: string): Promise<QuoteResult> {
  if (!(await checkRateLimit("quote"))) return { ok: false, message: "Too many tries — please wait a few minutes." };
  const postcode = normalisePostcode(String(postcodeInput ?? ""));
  if (!postcode) return { ok: false, message: "Enter a valid UK postcode." };
  const parsedLines = cartSchema.safeParse(lines);
  if (!parsedLines.success) return { ok: false, message: "Your cart is empty." };
  const when = new Date(String(slot ?? ""));
  return deliveryQuoteFor(postcode, parsedLines.data, Number.isNaN(when.getTime()) ? new Date() : when);
}

async function deliveryQuoteFor(postcode: string, lines: CartLineInput[], when: Date): Promise<QuoteResult> {
  const [settings, menu] = await Promise.all([getSettings(), getMenu()]);
  if (settings.deliveryPaused) return { ok: false, message: settings.deliveryPausedMessage };

  let customer;
  let kitchen;
  try {
    [customer, kitchen] = await Promise.all([lookupPostcode(postcode), getKitchenLocation()]);
  } catch (err) {
    console.error("Postcode lookup failed", err);
    return { ok: false, message: "We couldn't check that postcode right now. Please try again." };
  }
  if (!customer) return { ok: false, message: "We couldn't find that postcode." };

  const raining = settings.deliverySurcharges.rainPence > 0 ? await isRainForecast(kitchen, when) : false;
  const quote = quoteDelivery({
    postcode,
    distanceKm: roadDistanceKm(kitchen, customer),
    areas: settings.deliveryAreas,
    pricing: settings.deliveryPricing,
    surcharges: settings.deliverySurcharges,
    slotTime: formatTime(when.toISOString()),
    raining,
    subtotalPence: priceCart(lines, menu).subtotalPence,
    minOrderPence: settings.minOrderDeliveryPence,
  });
  if (quote.ok) {
    return { ok: true, postcode, distanceKm: quote.distanceKm, feePence: quote.feePence, breakdown: quote.breakdown };
  }
  if (quote.reason === "below_minimum") {
    return { ok: false, message: `Delivery needs a minimum order of ${formatPence(quote.minimumPence ?? 0)}.` };
  }
  return { ok: false, message: NOT_COVERED, whatsapp: true };
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

const fail = (message: string, fieldErrors?: FieldErrors): CheckoutResult => ({ ok: false, message, fieldErrors });

/**
 * Validates the order, re-prices it from the menu, saves it as `pending` and returns a
 * Stripe Checkout URL. The webhook (phase 6) marks it paid and sends notifications.
 */
export async function createCheckoutAction(input: CheckoutInput): Promise<CheckoutResult> {
  if (!(await checkRateLimit("checkout"))) return fail("Too many attempts — please wait a few minutes and try again.");

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof FieldErrors;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fail(fieldErrors.lines ?? "Please check the highlighted fields.", fieldErrors);
  }
  const order = parsed.data;

  const stripe = getStripe();
  const db = getAdminDb();
  if (!stripe || !db) {
    return fail("Online payment isn't set up yet. Please order on WhatsApp for now.");
  }

  const [settings, menu] = await Promise.all([getSettings(), getMenu()]);
  if (settings.ordersPaused) return fail("We're not taking online orders right now. Please check back soon.");

  const cart = priceCart(order.lines, menu);
  if (cart.issues.length || !cart.lines.length) {
    return fail("Something in your cart has changed or is no longer available. Please review your cart.");
  }
  if (!isValidSlot(order.slot, settings)) {
    return fail("That time is no longer available — please pick another.", { slot: "Pick another time." });
  }
  const slotDate = new Date(order.slot);
  const unavailable = unavailableLines(cart, slotDate);
  if (unavailable.length) {
    return fail(`${unavailable.map((l) => l.product.name).join(", ")} isn't available on that day. Please choose another day.`, {
      slot: "Pick another day.",
    });
  }

  let deliveryFeePence = 0;
  let deliveryDetails = "";
  let distanceKm: number | null = null;
  const postcode = order.fulfilment === "delivery" ? normalisePostcode(order.postcode) : null;
  if (order.fulfilment === "delivery") {
    const quote = await deliveryQuoteFor(postcode!, order.lines, slotDate);
    if (!quote.ok) return fail(quote.message, { postcode: quote.message });
    deliveryFeePence = quote.feePence;
    distanceKm = quote.distanceKm;
    deliveryDetails = quote.breakdown.length > 1 ? quote.breakdown.map((l) => `${l.label} ${formatPence(l.pence)}`).join(" + ") : "";
  }

  const vatRegistered = process.env.VAT_REGISTERED === "true";
  const totals = orderTotals(cart.subtotalPence, deliveryFeePence, vatRegistered);

  // Save the order first so it exists even if the customer abandons payment.
  const { data: saved, error: orderError } = await db
    .from("orders")
    .insert({
      fulfilment: order.fulfilment,
      scheduled_for: order.slot,
      customer_name: order.name,
      email: order.email,
      phone: order.phone,
      address_line1: order.fulfilment === "delivery" ? order.address1 : null,
      address_line2: order.fulfilment === "delivery" ? order.address2 || null : null,
      city: order.fulfilment === "delivery" ? order.city : null,
      postcode,
      distance_km: distanceKm,
      subtotal_pence: cart.subtotalPence,
      delivery_fee_pence: deliveryFeePence,
      total_pence: totals.totalPence,
      vat_pence: totals.vatPence,
      notes: order.notes || null,
    })
    .select("id, order_number")
    .single();
  if (orderError || !saved) {
    console.error("Order insert failed", orderError);
    return fail("We couldn't place your order. Please try again.");
  }

  const { error: itemsError } = await db.from("order_items").insert(
    cart.lines.map((l) => ({
      order_id: saved.id,
      product_slug: l.product.slug,
      product_name: l.product.name,
      unit_price_pence: l.unitPence,
      qty: l.qty,
      options: l.options.map((o) => ({ group: o.group, name: o.name, price_delta_pence: o.priceDeltaPence })),
      extras: l.extras.map((e) => ({ slug: e.slug, name: e.name, qty: e.qty, price_pence: e.pricePence })),
      line_total_pence: l.totalPence,
    })),
  );
  if (itemsError) {
    console.error("Order items insert failed", itemsError);
    await db.from("orders").delete().eq("id", saved.id);
    return fail("We couldn't place your order. Please try again.");
  }

  // In production the return URL must come from config, never the (spoofable) Host header.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV !== "production" ? await requestOrigin() : null);
  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is not set");
    await db.from("orders").update({ status: "cancelled" }).eq("id", saved.id);
    return fail("We couldn't start the payment. Please try again.");
  }
  const when = `${order.fulfilment === "delivery" ? "Delivery" : "Pickup"} · ${formatSlot(order.slot)}`;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        currency: "gbp",
        customer_email: order.email,
        client_reference_id: saved.id,
        metadata: { order_id: saved.id, order_number: String(saved.order_number) },
        payment_intent_data: {
          metadata: { order_id: saved.id, order_number: String(saved.order_number) },
          description: `Ofada Manchester order #${saved.order_number}`,
        },
        line_items: [
          ...cart.lines.map((l) => {
            const details = [...l.options.map((o) => o.name), ...l.extras.map((e) => `+${e.qty} ${e.name}`)].join(", ");
            // Bundle deals (e.g. 4 eggs) don't divide evenly per unit — charge the line as one.
            const even = l.totalPence === l.unitPence * l.qty;
            return {
              quantity: even ? l.qty : 1,
              price_data: {
                currency: "gbp",
                unit_amount: even ? l.unitPence : l.totalPence,
                product_data: {
                  name: even ? l.product.name : `${l.qty} × ${l.product.name}`,
                  ...(details ? { description: details } : {}),
                },
              },
            };
          }),
          ...(deliveryFeePence
            ? [
                {
                  quantity: 1,
                  price_data: {
                    currency: "gbp",
                    unit_amount: deliveryFeePence,
                    product_data: {
                      name: "Delivery",
                      description: [`${postcode} · ${distanceKm} km`, deliveryDetails].filter(Boolean).join(" · "),
                    },
                  },
                },
              ]
            : []),
        ],
        custom_text: { submit: { message: when } },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${siteUrl}/order/${saved.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout?cancelled=1`,
      },
      { idempotencyKey: `checkout-${saved.id}` },
    );

    await db.from("orders").update({ stripe_session_id: session.id }).eq("id", saved.id);
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("Stripe session failed", err);
    await db.from("orders").update({ status: "cancelled" }).eq("id", saved.id);
    return fail("We couldn't start the payment. Please try again.");
  }
}

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
