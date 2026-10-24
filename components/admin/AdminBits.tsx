"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { resendConfirmationAction, updateOrderStatusAction, type ActionResult } from "@/app/admin/orders/actions";
import { ACTION_LABELS, canCancel, nextStatuses, type OrderStatus } from "@/lib/admin/order-status";
import styles from "./Admin.module.css";

/** Re-fetches the page every `seconds` so new orders appear without reloading. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}

export function DateFilter({ value, status }: { value: string; status: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      className={styles.dateInput}
      value={value}
      aria-label="Day"
      onChange={(e) => e.target.value && router.push(`/admin?date=${e.target.value}&status=${status}`)}
    />
  );
}

export function OrderControls({
  orderId,
  status,
  fulfilment,
  stripeUrl,
}: {
  orderId: string;
  status: OrderStatus;
  fulfilment: "pickup" | "delivery";
  stripeUrl: string | null;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (fn: () => Promise<ActionResult>) => start(async () => setResult(await fn()));

  const next = nextStatuses(status, fulfilment);
  return (
    <div className={styles.stack}>
      <div className={styles.btnRow}>
        {next.map((to) => (
          <button
            key={to}
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={pending}
            onClick={() => run(() => updateOrderStatusAction(orderId, to))}
          >
            {ACTION_LABELS[to]} →
          </button>
        ))}
        {canCancel(status) && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            disabled={pending}
            onClick={() => {
              if (confirm("Cancel this order? You'll need to refund the customer in Stripe.")) {
                run(() => updateOrderStatusAction(orderId, "cancelled"));
              }
            }}
          >
            {ACTION_LABELS.cancelled}
          </button>
        )}
      </div>
      <div className={styles.btnRow}>
        {status !== "pending" && status !== "cancelled" && (
          <button type="button" className={styles.btn} disabled={pending} onClick={() => run(() => resendConfirmationAction(orderId))}>
            Resend confirmation email
          </button>
        )}
        {stripeUrl && (
          <a className={styles.btn} href={stripeUrl} target="_blank" rel="noopener noreferrer">
            View payment in Stripe ↗
          </a>
        )}
      </div>
      {result && (
        <p className={result.ok ? styles.success : styles.error} role="status">
          {result.message}
        </p>
      )}
    </div>
  );
}
