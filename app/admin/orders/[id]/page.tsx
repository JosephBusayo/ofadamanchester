import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import styles from "@/components/admin/Admin.module.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderControls } from "@/components/admin/AdminBits";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin/auth";
import type { OrderStatus } from "@/lib/admin/order-status";
import { addressLine, itemDetails, whenLine } from "@/lib/notifications/format";
import { getOrder } from "@/lib/orders";
import { formatPence } from "@/lib/pricing";
import { formatSlot } from "@/lib/schedule";

export const metadata = { title: "Order" };

export default function OrderPage(props: PageProps<"/admin/orders/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<p>Loading order…</p>}>
        <OrderDetail {...props} />
      </Suspense>
    </AdminShell>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  const { db } = await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const order = await getOrder(db, id);
  if (!order) notFound();

  const { data: payment } = await db.from("orders").select("stripe_payment_intent").eq("id", id).single();
  const testMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
  const stripeUrl = payment?.stripe_payment_intent
    ? `https://dashboard.stripe.com/${testMode ? "test/" : ""}payments/${payment.stripe_payment_intent}`
    : null;
  const address = addressLine(order);

  return (
    <>
      <p className="mb-3">
        <Link href="/admin" className="font-semibold underline underline-offset-4">
          ← All orders
        </Link>
      </p>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className={styles.title} style={{ margin: 0 }}>
          #{order.number}
        </h1>
        <StatusBadge status={order.status as OrderStatus} />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{whenLine(order)}</h2>
            <OrderControls
              orderId={order.id}
              status={order.status as OrderStatus}
              fulfilment={order.fulfilment}
              stripeUrl={stripeUrl}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Customer</h2>
            <dl className={styles.kv}>
              <dt>Name</dt>
              <dd>{order.customerName}</dd>
              <dt>Mobile</dt>
              <dd>
                <a className="underline" href={`tel:${order.phone}`}>
                  {order.phone}
                </a>{" "}
                ·{" "}
                <a className="underline" href={`https://wa.me/${order.phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </dd>
              <dt>Email</dt>
              <dd>
                <a className="underline" href={`mailto:${order.email}`}>
                  {order.email}
                </a>
              </dd>
              {address && (
                <>
                  <dt>Address</dt>
                  <dd>
                    <a
                      className="underline"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {address}
                    </a>
                    {order.distanceKm !== null && ` (≈${order.distanceKm.toFixed(1)} km)`}
                  </dd>
                </>
              )}
              <dt>Placed</dt>
              <dd>{formatSlot(order.createdAt)}</dd>
            </dl>
          </section>

          {order.notes && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Notes</h2>
              <p className={styles.notes}>{order.notes}</p>
            </section>
          )}
        </div>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Items</h2>
          <ul className={styles.items}>
            {order.items.map((item, i) => {
              const details = itemDetails(item);
              return (
                <li key={i}>
                  <span>
                    <strong>
                      {item.qty} × {item.name}
                    </strong>
                    {details && <small>{details}</small>}
                  </span>
                  <span>{formatPence(item.lineTotalPence)}</span>
                </li>
              );
            })}
          </ul>
          <div className={styles.totals}>
            <span>Subtotal</span>
            <span>{formatPence(order.subtotalPence)}</span>
          </div>
          <div className={styles.totals}>
            <span>Delivery</span>
            <span>{order.deliveryFeePence ? formatPence(order.deliveryFeePence) : "—"}</span>
          </div>
          <div className={`${styles.totals} ${styles.grand}`}>
            <span>Total</span>
            <span>{formatPence(order.totalPence)}</span>
          </div>
          {order.vatPence !== null && <p className={styles.hint}>Includes VAT of {formatPence(order.vatPence)}</p>}
        </section>
      </div>
    </>
  );
}
