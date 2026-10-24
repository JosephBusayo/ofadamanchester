"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction, setOrdersPausedAction, type SaveResult, type SettingsInput } from "@/app/admin/settings/actions";
import styles from "./Admin.module.css";

const DAYS = [
  ["1", "Monday"],
  ["2", "Tuesday"],
  ["3", "Wednesday"],
  ["4", "Thursday"],
  ["5", "Friday"],
  ["6", "Saturday"],
  ["0", "Sunday"],
] as const;
type DayKey = (typeof DAYS)[number][0];

const toPounds = (p: number) => (p / 100).toFixed(2);
const toPence = (s: string) => Math.round(parseFloat(s || "0") * 100);

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SaveResult | null>(null);
  const update = (patch: Partial<SettingsInput>) => {
    setS((prev) => ({ ...prev, ...patch }));
    setResult(null);
  };
  const setDay = (day: DayKey, periods: { open: string; close: string }[]) =>
    update({ openingHours: { ...s.openingHours, [day]: periods } });

  const togglePause = () => {
    const paused = !s.ordersPaused;
    if (paused && !confirm("Pause online orders? Customers won't be able to check out until you turn this back on.")) return;
    start(async () => {
      const r = await setOrdersPausedAction(paused);
      setResult(r);
      if (r.ok) setS((prev) => ({ ...prev, ordersPaused: paused }));
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => setResult(await saveSettingsAction(s)));
  };

  return (
    <form className={styles.stack} onSubmit={save}>
      <section className={styles.card}>
        <div className={styles.row}>
          <div>
            <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
              {s.ordersPaused ? "Orders paused" : "Taking orders"}
            </h2>
            <p className={styles.hint}>Pause if the kitchen is too busy or closed unexpectedly. Takes effect immediately.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!s.ordersPaused}
            aria-label="Taking online orders"
            className={styles.toggle}
            onClick={togglePause}
            disabled={pending}
          />
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Opening hours</h2>
        <p className={styles.hint}>Customers can choose pickup/delivery times inside these hours (Manchester time). Leave a day empty to close it.</p>
        {DAYS.map(([key, name]) => {
          const periods = s.openingHours[key] ?? [];
          return (
            <div key={key} className={styles.row} style={{ alignItems: "flex-start" }}>
              <strong style={{ minWidth: 110, paddingTop: 12 }}>{name}</strong>
              <div className={styles.stack} style={{ flex: 1, gap: 8 }}>
                {periods.length === 0 && <span className={styles.hint} style={{ paddingTop: 12 }}>Closed</span>}
                {periods.map((p, i) => (
                  <div key={i} className={styles.btnRow} style={{ alignItems: "center" }}>
                    <input
                      type="time"
                      className={`${styles.input} ${styles.inputSmall}`}
                      style={{ width: 140 }}
                      value={p.open}
                      aria-label={`${name} opens`}
                      onChange={(e) => setDay(key, periods.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      className={`${styles.input} ${styles.inputSmall}`}
                      style={{ width: 140 }}
                      value={p.close}
                      aria-label={`${name} closes`}
                      onChange={(e) => setDay(key, periods.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))}
                    />
                    <button type="button" className={styles.signOut} onClick={() => setDay(key, periods.filter((_, j) => j !== i))}>
                      Remove
                    </button>
                  </div>
                ))}
                {periods.length < 3 && (
                  <button
                    type="button"
                    className={styles.signOut}
                    style={{ alignSelf: "flex-start" }}
                    onClick={() => setDay(key, [...periods, { open: "12:00", close: "20:00" }])}
                  >
                    + Add hours
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <label className={styles.field} style={{ marginTop: 14 }}>
          <span className={styles.label}>Preparation time (minutes)</span>
          <input
            type="number"
            min={0}
            max={240}
            className={`${styles.input} ${styles.inputSmall}`}
            value={s.leadTimeMinutes}
            onChange={(e) => update({ leadTimeMinutes: Number(e.target.value) })}
          />
          <span className={styles.hint}>The earliest time a customer can pick is now + this.</span>
        </label>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Delivery</h2>
        <p className={styles.hint}>Fee by driving distance from the kitchen (about 1.3× straight-line). Bands are matched from the shortest.</p>
        {s.deliveryTiers.map((t, i) => (
          <div key={i} className={styles.btnRow} style={{ alignItems: "center", marginTop: 10 }}>
            <span>Up to</span>
            <input
              type="number"
              step="0.5"
              min={0.5}
              className={`${styles.input} ${styles.inputSmall}`}
              value={t.maxKm}
              aria-label={`Band ${i + 1} distance in km`}
              onChange={(e) =>
                update({ deliveryTiers: s.deliveryTiers.map((x, j) => (j === i ? { ...x, maxKm: Number(e.target.value) } : x)) })
              }
            />
            <span>km → £</span>
            <input
              type="number"
              step="0.50"
              min={0}
              className={`${styles.input} ${styles.inputSmall}`}
              value={toPounds(t.feePence)}
              aria-label={`Band ${i + 1} fee in pounds`}
              onChange={(e) =>
                update({ deliveryTiers: s.deliveryTiers.map((x, j) => (j === i ? { ...x, feePence: toPence(e.target.value) } : x)) })
              }
            />
            {s.deliveryTiers.length > 1 && (
              <button type="button" className={styles.signOut} onClick={() => update({ deliveryTiers: s.deliveryTiers.filter((_, j) => j !== i) })}>
                Remove
              </button>
            )}
          </div>
        ))}
        {s.deliveryTiers.length < 6 && (
          <button
            type="button"
            className={styles.signOut}
            style={{ marginTop: 10 }}
            onClick={() => {
              const last = s.deliveryTiers.at(-1);
              update({ deliveryTiers: [...s.deliveryTiers, { maxKm: (last?.maxKm ?? 0) + 3, feePence: (last?.feePence ?? 300) + 200 }] });
            }}
          >
            + Add band
          </button>
        )}
        <div className={styles.btnRow} style={{ marginTop: 16 }}>
          <label className={styles.field}>
            <span className={styles.label}>Furthest delivery (km)</span>
            <input
              type="number"
              step="0.5"
              min={0.5}
              className={`${styles.input} ${styles.inputSmall}`}
              value={s.maxDeliveryKm}
              onChange={(e) => update({ maxDeliveryKm: Number(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Minimum order for delivery (£)</span>
            <input
              type="number"
              step="0.50"
              min={0}
              className={`${styles.input} ${styles.inputSmall}`}
              value={toPounds(s.minOrderDeliveryPence)}
              onChange={(e) => update({ minOrderDeliveryPence: toPence(e.target.value) })}
            />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Pickup</h2>
        <label className={styles.field}>
          <span className={styles.label}>Pickup address (shown at checkout and in emails)</span>
          <input className={styles.input} value={s.pickupAddress} maxLength={200} onChange={(e) => update({ pickupAddress: e.target.value })} />
        </label>
      </section>

      <div className={styles.btnRow} style={{ alignItems: "center" }}>
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        {result && (
          <p className={result.ok ? styles.success : styles.error} role="status">
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
