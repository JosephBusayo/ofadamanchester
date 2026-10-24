import Link from "next/link";
import { Suspense } from "react";
import styles from "@/components/admin/Admin.module.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { AutoRefresh, DateFilter } from "@/components/admin/AdminBits";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin/auth";
import { STATUS_FILTERS, type OrderStatus, type StatusFilter } from "@/lib/admin/order-status";
import { formatPence } from "@/lib/pricing";
import { formatTime, londonDayBounds, londonToday } from "@/lib/schedule";

export const metadata = { title: "Orders" };

const FILTER_LABELS: Record<StatusFilter, string> = { active: "To do", completed: "Completed", unpaid: "Unpaid / cancelled", all: "All" };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function OrdersPage(props: PageProps<"/admin">) {
  return (
    <AdminShell>
      <Suspense fallback={<p>Loading orders…</p>}>
        <Orders {...props} />
      </Suspense>
    </AdminShell>
  );
}

type Row = {
  id: string;
  order_number: number;
  status: OrderStatus;
  fulfilment: "pickup" | "delivery";
  scheduled_for: string;
  customer_name: string;
  postcode: string | null;
  total_pence: number;
  order_items: { qty: number; product_name: string }[];
};

async function Orders({ searchParams }: PageProps<"/admin">) {
  const { db } = await requireAdmin();
  const sp = await searchParams;
  const today = londonToday();
  const date = typeof sp.date === "string" && DATE.test(sp.date) ? sp.date : today;
  const filter: StatusFilter = typeof sp.status === "string" && sp.status in STATUS_FILTERS ? (sp.status as StatusFilter) : "active";
  const { start, end } = londonDayBounds(date);

  const { data, error } = await db
    .from("orders")
    .select("id, order_number, status, fulfilment, scheduled_for, customer_name, postcode, total_pence, order_items (qty, product_name)")
    .gte("scheduled_for", start.toISOString())
    .lt("scheduled_for", end.toISOString())
    .order("scheduled_for", { ascending: true });
  if (error) return <p className={styles.error}>Couldn&apos;t load orders: {error.message}</p>;

  const rows = (data ?? []) as Row[];
  const counts = Object.fromEntries(
    Object.entries(STATUS_FILTERS).map(([k, statuses]) => [k, rows.filter((r) => (statuses as OrderStatus[]).includes(r.status)).length]),
  ) as Record<StatusFilter, number>;
  const shown = rows.filter((r) => (STATUS_FILTERS[filter] as OrderStatus[]).includes(r.status));
  const takings = rows
    .filter((r) => r.status !== "pending" && r.status !== "cancelled")
    .reduce((sum, r) => sum + r.total_pence, 0);

  return (
    <>
      <AutoRefresh seconds={30} />
      <h1 className={styles.title}>{date === today ? "TODAY'S ORDERS" : "ORDERS"}</h1>
      <p className={styles.subtitle}>
        {counts.active} to do · {counts.completed} completed · {formatPence(takings)} taken · refreshes every 30s
      </p>

      <div className={styles.filters}>
        <DateFilter value={date} status={filter} />
        {date !== today && (
          <Link className={styles.pill} href={`/admin?status=${filter}`}>
            Today
          </Link>
        )}
        {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((f) => (
          <Link key={f} href={`/admin?date=${date}&status=${f}`} className={`${styles.pill} ${f === filter ? styles.pillOn : ""}`}>
            {FILTER_LABELS[f]} <span className={styles.count}>{counts[f]}</span>
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>No {filter === "active" ? "orders to do" : "orders"} for this day.</div>
      ) : (
        <div className={styles.list}>
          {shown.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className={styles.order}>
              <span className={styles.orderNum}>#{o.order_number}</span>
              <span className={styles.orderWhen}>
                {formatTime(o.scheduled_for)}
                <small>{o.fulfilment === "delivery" ? `Delivery${o.postcode ? ` · ${o.postcode}` : ""}` : "Pickup"}</small>
              </span>
              <span className={styles.orderWho}>
                <strong>{o.customer_name}</strong>
                <span>{o.order_items.map((i) => `${i.qty}× ${i.product_name}`).join(", ")}</span>
              </span>
              <span className={styles.orderTotal}>{formatPence(o.total_pence)}</span>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
