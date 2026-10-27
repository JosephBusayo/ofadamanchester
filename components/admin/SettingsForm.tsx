"use client";

import { useState, useTransition } from "react";
import {
  saveSettingsAction,
  setDeliveryPausedAction,
  setOrdersPausedAction,
  type SaveResult,
  type SettingsInput,
} from "@/app/admin/settings/actions";
import { normaliseDistrict } from "@/lib/delivery";
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

type AutoPrices = Record<string, { km: number; pence: number } | null>;

export function SettingsForm({ initial, autoPrices }: { initial: SettingsInput; autoPrices: AutoPrices }) {
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

  const [newArea, setNewArea] = useState("");
  const [areaError, setAreaError] = useState("");
  const addArea = () => {
    const district = normaliseDistrict(newArea);
    if (!district) return setAreaError("Type the first part of a postcode, e.g. M14 or SK4.");
    if (s.deliveryAreas.some((a) => a.district === district)) return setAreaError(`${district} is already on the list.`);
    update({ deliveryAreas: [...s.deliveryAreas, { district, feePence: null }] });
    setNewArea("");
    setAreaError("");
  };

  const toggleDelivery = () => {
    const paused = !s.deliveryPaused;
    start(async () => {
      const r = await setDeliveryPausedAction(paused, s.deliveryPausedMessage);
      setResult(r);
      if (r.ok) setS((prev) => ({ ...prev, deliveryPaused: paused }));
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
        <div className={styles.row}>
          <div>
            <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
              {s.deliveryPaused ? "Delivery paused" : "Delivering"}
            </h2>
            <p className={styles.hint}>Turn off delivery only (bad weather, no driver). Pickup keeps working. Takes effect immediately.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!s.deliveryPaused}
            aria-label="Delivering"
            className={styles.toggle}
            onClick={toggleDelivery}
            disabled={pending}
          />
        </div>
        <label className={styles.field} style={{ marginTop: 12 }}>
          <span className={styles.label}>Message customers see when delivery is off</span>
          <input
            className={styles.input}
            value={s.deliveryPausedMessage}
            maxLength={160}
            onChange={(e) => update({ deliveryPausedMessage: e.target.value })}
          />
        </label>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Delivery price</h2>
        <p className={styles.hint}>
          The base fee is the minimum and covers the first few km from the kitchen; each extra km is added on top. Prices are
          rounded up to the next 50p.
        </p>
        <div className={styles.btnRow} style={{ alignItems: "center", marginTop: 10 }}>
          <span>£</span>
          <input
            type="number"
            step="0.50"
            min={0}
            className={`${styles.input} ${styles.inputSmall}`}
            value={toPounds(s.deliveryPricing.basePence)}
            aria-label="Base delivery fee in pounds"
            onChange={(e) => update({ deliveryPricing: { ...s.deliveryPricing, basePence: toPence(e.target.value) } })}
          />
          <span>for the first</span>
          <input
            type="number"
            step="0.5"
            min={0}
            className={`${styles.input} ${styles.inputSmall}`}
            value={s.deliveryPricing.baseKm}
            aria-label="Km covered by the base fee"
            onChange={(e) => update({ deliveryPricing: { ...s.deliveryPricing, baseKm: Number(e.target.value) } })}
          />
          <span>km, then £</span>
          <input
            type="number"
            step="0.10"
            min={0}
            className={`${styles.input} ${styles.inputSmall}`}
            value={toPounds(s.deliveryPricing.perKmPence)}
            aria-label="Price per extra km in pounds"
            onChange={(e) => update({ deliveryPricing: { ...s.deliveryPricing, perKmPence: toPence(e.target.value) } })}
          />
          <span>per extra km</span>
        </div>
        <div className={styles.btnRow} style={{ alignItems: "center", marginTop: 10 }}>
          <span>Long-distance discount:</span>
          <input
            type="number"
            step="1"
            min={0}
            max={50}
            className={`${styles.input} ${styles.inputSmall}`}
            value={s.deliveryPricing.farDiscountPercent}
            aria-label="Long-distance discount percent"
            onChange={(e) => update({ deliveryPricing: { ...s.deliveryPricing, farDiscountPercent: Number(e.target.value) } })}
          />
          <span>% off deliveries further than</span>
          <input
            type="number"
            step="0.5"
            min={0}
            className={`${styles.input} ${styles.inputSmall}`}
            value={s.deliveryPricing.farKm}
            aria-label="Discount applies beyond this many km"
            onChange={(e) => update({ deliveryPricing: { ...s.deliveryPricing, farKm: Number(e.target.value) } })}
          />
          <span>km</span>
        </div>
        <p className={styles.hint} style={{ marginTop: 6 }}>
          Also applies to fixed-price areas that far away. Never takes a fee below the base fee. 0% = no discount.
        </p>

        <h3 className={styles.label} style={{ marginTop: 22 }}>Extra charges (£0 = off)</h3>
        <div className={styles.btnRow} style={{ alignItems: "center", marginTop: 8 }}>
          <span>Evening: deliveries from</span>
          <input
            type="time"
            className={`${styles.input} ${styles.inputSmall}`}
            style={{ width: 140 }}
            value={s.deliverySurcharges.nightFrom}
            aria-label="Evening charge starts at"
            onChange={(e) => update({ deliverySurcharges: { ...s.deliverySurcharges, nightFrom: e.target.value } })}
          />
          <span>add £</span>
          <input
            type="number"
            step="0.50"
            min={0}
            className={`${styles.input} ${styles.inputSmall}`}
            value={toPounds(s.deliverySurcharges.nightPence)}
            aria-label="Evening charge in pounds"
            onChange={(e) => update({ deliverySurcharges: { ...s.deliverySurcharges, nightPence: toPence(e.target.value) } })}
          />
        </div>
        <div className={styles.btnRow} style={{ alignItems: "center", marginTop: 8 }}>
          <span>Rain: when rain is forecast at the delivery time, add £</span>
          <input
            type="number"
            step="0.50"
            min={0}
            className={`${styles.input} ${styles.inputSmall}`}
            value={toPounds(s.deliverySurcharges.rainPence)}
            aria-label="Rain charge in pounds"
            onChange={(e) => update({ deliverySurcharges: { ...s.deliverySurcharges, rainPence: toPence(e.target.value) } })}
          />
        </div>
        <p className={styles.hint} style={{ marginTop: 6 }}>Rain is checked automatically from the weather forecast for Manchester.</p>

        <label className={styles.field} style={{ marginTop: 16 }}>
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
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Where we deliver</h2>
        <p className={styles.hint}>
          Postcode areas (the first part of a postcode, e.g. M14). Leave the price empty to use the automatic price, or type a fixed
          price. Customers outside this list are sent to WhatsApp.
        </p>
        {s.deliveryAreas.length === 0 && <p className={styles.error}>No areas — nobody can order delivery online.</p>}
        {s.deliveryAreas.map((a, i) => {
          const auto = autoPrices[a.district];
          return (
            <div key={a.district} className={styles.btnRow} style={{ alignItems: "center", marginTop: 8 }}>
              <strong style={{ minWidth: 64 }}>{a.district}</strong>
              <span>£</span>
              <input
                type="number"
                step="0.50"
                min={0}
                className={`${styles.input} ${styles.inputSmall}`}
                value={a.feePence === null ? "" : toPounds(a.feePence)}
                placeholder={auto ? toPounds(auto.pence) : "auto"}
                aria-label={`${a.district} price in pounds (empty = automatic)`}
                onChange={(e) =>
                  update({
                    deliveryAreas: s.deliveryAreas.map((x, j) =>
                      j === i ? { ...x, feePence: e.target.value === "" ? null : toPence(e.target.value) } : x,
                    ),
                  })
                }
              />
              <span className={styles.hint}>
                {a.feePence !== null
                  ? "Fixed price"
                  : auto
                    ? `Auto · about ${auto.km.toFixed(1)} km${auto.km > s.deliveryPricing.farKm && s.deliveryPricing.farDiscountPercent > 0 ? ` · ${s.deliveryPricing.farDiscountPercent}% off included` : ""}`
                    : "Auto · shown after saving"}
              </span>
              <button
                type="button"
                className={styles.signOut}
                onClick={() => update({ deliveryAreas: s.deliveryAreas.filter((_, j) => j !== i) })}
              >
                Remove
              </button>
            </div>
          );
        })}
        <div className={styles.btnRow} style={{ alignItems: "center", marginTop: 14 }}>
          <input
            className={`${styles.input} ${styles.inputSmall}`}
            style={{ width: 120 }}
            value={newArea}
            placeholder="e.g. M14"
            aria-label="Add a postcode area"
            maxLength={4}
            onChange={(e) => {
              setNewArea(e.target.value);
              setAreaError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addArea();
              }
            }}
          />
          <button type="button" className={styles.signOut} onClick={addArea}>
            + Add area
          </button>
        </div>
        {areaError && <p className={styles.error}>{areaError}</p>}
        <p className={styles.hint} style={{ marginTop: 10 }}>
          Auto prices are measured to the middle of each area, so a customer at the edge may pay 50p more or less.
        </p>
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
