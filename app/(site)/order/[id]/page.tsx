import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import styles from "@/components/checkout/Checkout.module.css";
import { ClearCartOnPaid } from "@/components/checkout/ClearCartOnPaid";
import { site } from "@/content/site";
import { formatPence } from "@/lib/pricing";
import { formatSlot } from "@/lib/schedule";
import { getSettings } from "@/lib/settings";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderPage(props: PageProps<"/order/[id]">) {
  return (
    <Suspense fallback={<div className={styles.page} aria-busy="true" />}>
      <OrderDetails {...props} />
    </Suspense>
  );
}

type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  fulfilment: "pickup" | "delivery";
  scheduled_for: string | null;
  customer_name: string;
  email: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  subtotal_pence: number;
  delivery_fee_pence: number;
  total_pence: number;
  vat_pence: number | null;
  stripe_session_id: string | null;
  order_items: {
    product_name: string;
    qty: number;
    line_total_pence: number;
    options: { name: string }[];
    extras: { name: string; qty: number }[];
  }[];
};

async function OrderDetails({ params, searchParams }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const sessionId = (await searchParams).session_id;
  const db = getAdminDb();
  if (!db || !UUID.test(id) || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) notFound();

  // Only show an order to someone holding its Stripe session id (from the redirect).
  const { data } = await db
    .from("orders")
    .select(
      "id, order_number, status, fulfilment, scheduled_for, customer_name, email, address_line1, address_line2, city, postcode, subtotal_pence, delivery_fee_pence, total_pence, vat_pence, stripe_session_id, order_items (product_name, qty, line_total_pence, options, extras)",
    )
    .eq("id", id)
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  const order = data as OrderRow | null;
  if (!order) notFound();

  // The webhook (phase 6) is the source of truth; until it lands, ask Stripe directly
  // so the customer sees the right message straight after paying.
  let paid = order.status !== "pending" && order.status !== "cancelled";
  if (!paid) {
    const session = await getStripe()?.checkout.sessions.retrieve(sessionId).catch(() => null);
    paid = session?.payment_status === "paid";
  }
  const settings = await getSettings();
  const firstName = order.customer_name.split(" ")[0];

  return (
    <div className={styles.page}>
      <ClearCartOnPaid paid={paid} />
      <p className={styles.kicker}>ORDER #{order.order_number}</p>
      <h1 className={styles.title}>{paid ? `THANK YOU, ${firstName.toUpperCase()}!` : "PAYMENT PENDING"}</h1>

      <div className={styles.grid}>
        <div className={styles.form}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{paid ? "WE'VE GOT YOUR ORDER" : "NOT PAID YET"}</h2>
            <p className="text-lg leading-relaxed">
              {paid ? (
                <>
                  A confirmation is on its way to <strong>{order.email}</strong>. We&apos;ll start cooking in time for your{" "}
                  {order.fulfilment}.
                </>
              ) : (
                <>
                  We haven&apos;t received payment for this order. If you were charged, message us on{" "}
                  <a className="underline" href={site.whatsapp.href}>
                    WhatsApp
                  </a>{" "}
                  with your order number.
                </>
              )}
            </p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{order.fulfilment === "pickup" ? "PICKUP" : "DELIVERY"}</h2>
            <div className="flex flex-col gap-2 text-lg">
              {order.scheduled_for && (
                <p>
                  <strong>{formatSlot(order.scheduled_for)}</strong>
                </p>
              )}
              {order.fulfilment === "pickup" ? (
                <p>{settings.pickupAddress}</p>
              ) : (
                <p>
                  {[order.address_line1, order.address_line2, order.city, order.postcode].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="text-base opacity-70">
                Questions? WhatsApp us on{" "}
                <a className="underline" href={site.whatsapp.href}>
                  {site.whatsapp.display}
                </a>
                .
              </p>
            </div>
          </section>
        </div>

        <aside className={`${styles.card} ${styles.summary}`}>
          <h2 className={styles.cardTitle}>SUMMARY</h2>
          <ul className={styles.items}>
            {order.order_items.map((item, i) => {
              const note = [...item.options.map((o) => o.name), ...item.extras.map((e) => `+ ${e.qty > 1 ? `${e.qty}× ` : ""}${e.name}`)].join(" · ");
              return (
                <li key={i} className={styles.item}>
                  <span>
                    <span className={styles.itemName}>
                      {item.qty} × {item.product_name}
                    </span>
                    {note && <span className={styles.itemNote}>{note}</span>}
                  </span>
                  <span className={styles.itemPrice}>{formatPence(item.line_total_pence)}</span>
                </li>
              );
            })}
          </ul>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span>Subtotal</span>
              <span>{formatPence(order.subtotal_pence)}</span>
            </div>
            <div className={styles.row}>
              <span>Delivery</span>
              <span>{order.delivery_fee_pence ? formatPence(order.delivery_fee_pence) : "Free"}</span>
            </div>
          </div>
          <div className={styles.totalRow}>
            <span>{paid ? "Paid" : "Total"}</span>
            <span>{formatPence(order.total_pence)}</span>
          </div>
          {order.vat_pence !== null && <p className={styles.vat}>Includes VAT of {formatPence(order.vat_pence)}</p>}
          <Link href="/menu" className={styles.pay}>
            BACK TO MENU →
          </Link>
        </aside>
      </div>
    </div>
  );
}
