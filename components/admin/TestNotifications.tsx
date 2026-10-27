"use client";

import { useState, useTransition } from "react";
import { sendTestNotificationsAction } from "@/app/admin/settings/actions";
import type { ChannelResult } from "@/lib/notifications/notify";
import styles from "./Admin.module.css";

const ICON = { sent: "✓", skipped: "–", failed: "✕" } as const;
const LABEL = { sent: "Sent", skipped: "Not set up", failed: "Failed" } as const;

export function TestNotifications() {
  const [pending, start] = useTransition();
  const [results, setResults] = useState<ChannelResult[] | null>(null);
  const [error, setError] = useState("");

  const run = () =>
    start(async () => {
      setError("");
      const r = await sendTestNotificationsAction();
      if ("error" in r) setError(r.error);
      else setResults(r.results);
    });

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Notifications</h2>
      <p className={styles.hint} style={{ marginBottom: 14 }}>
        Sends a sample order (#9999, marked TEST) through the real alerts: the customer confirmation goes to your email,
        the owner email to <code>OWNER_EMAIL</code> and the WhatsApp to <code>OWNER_WHATSAPP</code>. No order is created.
      </p>
      <button type="button" className={styles.btn} onClick={run} disabled={pending}>
        {pending ? "Sending…" : "Send test notifications"}
      </button>
      {error && (
        <p className={styles.error} role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {results && (
        <div role="status" style={{ marginTop: 12 }}>
          {results.map((r) => (
            <div key={r.channel} className={styles.row}>
              <div>
                <strong>
                  {ICON[r.status]} {r.channel}
                </strong>
                {r.detail && <div className={styles.hint}>{r.detail}</div>}
              </div>
              <span className={r.status === "failed" ? styles.error : styles.hint}>{LABEL[r.status]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
