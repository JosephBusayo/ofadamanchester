"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createCheckoutAction, quoteDeliveryAction, type QuoteResult } from "@/app/(site)/checkout/actions";
import { checkoutCopy as copy } from "@/content/checkout";
import { site } from "@/content/site";
import { useCart } from "@/lib/cart";
import type { FieldErrors } from "@/lib/checkout-schema";
import type { Menu } from "@/lib/menu/types";
import { formatPence, isAvailableOn, orderTotals, priceCart } from "@/lib/pricing";
import { availableSlots, type SlotDay } from "@/lib/schedule";
import type { PublicSettings } from "@/lib/settings";
import styles from "./Checkout.module.css";

type Fulfilment = "pickup" | "delivery";

export function CheckoutForm({
  menu,
  settings,
  testMode,
}: {
  menu: Menu;
  settings: PublicSettings;
  testMode: boolean;
}) {
  const { lines, ready, open: openCart } = useCart();
  const cart = useMemo(() => priceCart(lines, menu), [lines, menu]);

  const [fulfilment, setFulfilment] = useState<Fulfilment>("pickup");
  const [days, setDays] = useState<SlotDay[] | null>(null);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address1: "", address2: "", city: "", postcode: "", notes: "" });
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoting, startQuote] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  // Slots depend on the current time, so compute them in the browser after mount.
  // Saturday-only items (MoiMoi) limit the choice to days they're available.
  useEffect(() => {
    const all = availableSlots(settings);
    const usable = all.filter((d) => {
      const date = new Date(d.slots[0].iso);
      return cart.lines.every((l) => isAvailableOn(l.product, date));
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- time-dependent, client-only
    setDays(usable);
  }, [settings, cart.lines]);

  useEffect(() => {
    if (!days?.length) return;
    const current = days.find((d) => d.date === day);
    if (!current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- default to the first available day/time
      setDay(days[0].date);
      setSlot(days[0].slots[0].iso);
    } else if (!current.slots.some((s) => s.iso === slot)) {
      setSlot(current.slots[0].iso);
    }
  }, [days, day, slot]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read ?cancelled=1 from Stripe's cancel URL
    setCancelled(new URLSearchParams(location.search).has("cancelled"));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    if (key === "postcode") setQuote(null);
  };

  const checkPostcode = (postcode = form.postcode) => {
    if (!postcode.trim()) return;
    startQuote(async () => {
      const result = await quoteDeliveryAction(postcode, lines, slot);
      setQuote(result);
      if (result.ok) setForm((f) => ({ ...f, postcode: result.postcode }));
    });
  };

  // Evening and rain surcharges depend on the time, so re-price when the slot changes.
  const quotedSlot = useRef(slot);
  useEffect(() => {
    if (quotedSlot.current === slot) return;
    quotedSlot.current = slot;
    if (fulfilment === "delivery" && quote?.ok) checkPostcode(quote.postcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the slot changes
  }, [slot]);

  const deliveryFee = fulfilment === "delivery" && quote?.ok ? quote.feePence : 0;
  const totals = orderTotals(cart.subtotalPence, deliveryFee, settings.vatRegistered);
  const needsQuote = fulfilment === "delivery" && !quote?.ok;
  const selectedDay = days?.find((d) => d.date === day);
  const canPay =
    !settings.ordersPaused && cart.lines.length > 0 && cart.issues.length === 0 && !!slot && !submitting && !needsQuote;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    startSubmit(async () => {
      const result = await createCheckoutAction({ lines, fulfilment, slot, ...form });
      if (result.ok) {
        location.assign(result.url);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.message);
    });
  };

  if (!ready) return <div className={styles.page} aria-busy="true" />;

  if (!lines.length) {
    return (
      <div className={styles.page}>
        <p className={styles.kicker}>{copy.kicker}</p>
        <h1 className={styles.title}>{copy.emptyTitle}</h1>
        <div className={styles.empty}>
          <p>{copy.emptyBody}</p>
          <Link href="/menu" className={styles.pay} style={{ width: "auto" }}>
            {copy.viewMenu} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>{copy.kicker}</p>
      <h1 className={styles.title}>{copy.title}</h1>
      {testMode && <p className={`${styles.banner} ${styles.bannerTest}`}>{copy.testMode}</p>}
      {cancelled && <p className={styles.banner}>{copy.cancelled}</p>}
      {settings.ordersPaused && <p className={styles.banner}>{copy.paused}</p>}

      <form className={styles.grid} onSubmit={submit} noValidate>
        <div className={styles.form}>
          {/* How */}
          <section className={styles.card} aria-labelledby="how-title">
            <h2 id="how-title" className={styles.cardTitle}>
              {copy.howTitle}
            </h2>
            <div className={styles.choices} role="radiogroup" aria-labelledby="how-title">
              {(["pickup", "delivery"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={fulfilment === f}
                  className={styles.choice}
                  disabled={f === "delivery" && settings.deliveryPaused}
                  onClick={() => setFulfilment(f)}
                >
                  <span className={styles.choiceName}>{f === "pickup" ? copy.pickup : copy.delivery}</span>
                  <span className={styles.choiceNote}>
                    {f === "pickup"
                      ? `${copy.pickupNote} ${settings.pickupAddress}`
                      : settings.deliveryPaused
                        ? settings.deliveryPausedMessage
                        : copy.deliveryNote}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* When */}
          <section className={styles.card} aria-labelledby="when-title">
            <h2 id="when-title" className={styles.cardTitle}>
              {copy.whenTitle}
            </h2>
            {days === null ? null : days.length === 0 ? (
              <p className={styles.error}>{copy.noSlots}</p>
            ) : (
              <>
                {cart.lines.some((l) => l.product.availableDays) && <p className={styles.hint}>{copy.saturdayOnlyNote}</p>}
                <div className={styles.days} role="radiogroup" aria-label="Day">
                  {days.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      role="radio"
                      aria-checked={day === d.date}
                      className={styles.pill}
                      onClick={() => setDay(d.date)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {selectedDay && (
                  <label className={`${styles.field} ${styles.times}`}>
                    <span className={styles.label}>{copy.timeLabel}</span>
                    <select
                      className={styles.select}
                      value={slot}
                      onChange={(e) => setSlot(e.target.value)}
                      aria-invalid={!!errors.slot}
                    >
                      {selectedDay.slots.map((s, i) => (
                        <option key={s.iso} value={s.iso}>
                          {i === 0 && selectedDay.label === "Today" ? `${copy.asap} (about ${s.time})` : s.time}
                        </option>
                      ))}
                    </select>
                    {errors.slot && <span className={styles.error}>{errors.slot}</span>}
                  </label>
                )}
              </>
            )}
          </section>

          {/* Delivery address */}
          {fulfilment === "delivery" && (
            <section className={styles.card} aria-labelledby="address-title">
              <h2 id="address-title" className={styles.cardTitle}>
                {copy.addressTitle}
              </h2>
              <div className={styles.fields}>
                <label className={`${styles.field} ${styles.full}`}>
                  <span className={styles.label}>{copy.postcode}</span>
                  <div className={styles.inline}>
                    <input
                      className={styles.input}
                      value={form.postcode}
                      onChange={set("postcode")}
                      onBlur={() => checkPostcode()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          checkPostcode();
                        }
                      }}
                      autoComplete="postal-code"
                      inputMode="text"
                      maxLength={10}
                      aria-invalid={!!errors.postcode || quote?.ok === false}
                    />
                    <button type="button" className={styles.btnSmall} onClick={() => checkPostcode()} disabled={quoting}>
                      {quoting ? "…" : copy.checkPostcode}
                    </button>
                  </div>
                  {quote?.ok === true && (
                    <span className={styles.ok}>
                      {formatPence(quote.feePence)} delivery · about {quote.distanceKm.toFixed(1)} km away
                      {quote.breakdown.length > 1 &&
                        ` (${quote.breakdown.map((l) => `${l.label} ${formatPence(l.pence)}`).join(" + ")})`}
                    </span>
                  )}
                  {quote?.ok === false && (
                    <span className={styles.error}>
                      {quote.message}
                      {quote.whatsapp && (
                        <>
                          {" "}
                          <a className="underline" href={site.whatsapp.href} target="_blank" rel="noopener noreferrer">
                            {copy.deliveryWhatsapp} {site.whatsapp.display}
                          </a>
                        </>
                      )}
                    </span>
                  )}
                  {!quote && errors.postcode && <span className={styles.error}>{errors.postcode}</span>}
                </label>
                <Field label={copy.address1} value={form.address1} onChange={set("address1")} error={errors.address1} autoComplete="address-line1" full />
                <Field label={copy.address2} value={form.address2} onChange={set("address2")} autoComplete="address-line2" full />
                <Field label={copy.city} value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
              </div>
            </section>
          )}

          {/* Details */}
          <section className={styles.card} aria-labelledby="details-title">
            <h2 id="details-title" className={styles.cardTitle}>
              {copy.detailsTitle}
            </h2>
            <div className={styles.fields}>
              <Field label={copy.name} value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" full />
              <Field
                label={copy.email}
                hint={copy.emailHint}
                type="email"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                autoComplete="email"
              />
              <Field
                label={copy.phone}
                hint={copy.phoneHint}
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                error={errors.phone}
                autoComplete="tel"
              />
              <label className={`${styles.field} ${styles.full}`}>
                <span className={styles.label}>{copy.notes}</span>
                <textarea
                  className={styles.textarea}
                  value={form.notes}
                  onChange={set("notes")}
                  maxLength={300}
                  placeholder={copy.notesPlaceholder}
                />
              </label>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className={`${styles.card} ${styles.summary}`} aria-labelledby="summary-title">
          <h2 id="summary-title" className={styles.cardTitle}>
            {copy.summaryTitle}
          </h2>
          <ul className={styles.items}>
            {cart.lines.map((l) => {
              const note = [...l.options.map((o) => o.name), ...l.extras.map((e) => `+ ${e.qty > 1 ? `${e.qty}× ` : ""}${e.name}`)].join(" · ");
              return (
                <li key={l.index} className={styles.item}>
                  <span>
                    <span className={styles.itemName}>
                      {l.qty} × {l.product.name}
                    </span>
                    {note && <span className={styles.itemNote}>{note}</span>}
                  </span>
                  <span className={styles.itemPrice}>{formatPence(l.totalPence)}</span>
                </li>
              );
            })}
          </ul>
          <button type="button" className={styles.editCart} onClick={openCart}>
            {copy.editCart}
          </button>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span>{copy.subtotal}</span>
              <span>{formatPence(cart.subtotalPence)}</span>
            </div>
            <div className={styles.row}>
              <span>{copy.deliveryFee}</span>
              <span>
                {fulfilment === "pickup" ? copy.free : quote?.ok ? formatPence(quote.feePence) : copy.deliveryPending}
              </span>
            </div>
          </div>
          <div className={styles.totalRow}>
            <span>{copy.total}</span>
            <span>{formatPence(totals.totalPence)}</span>
          </div>
          {totals.vatPence !== null && (
            <p className={styles.vat}>
              {copy.vatIncluded} {formatPence(totals.vatPence)}
            </p>
          )}
          <button type="submit" className={styles.pay} disabled={!canPay} aria-busy={submitting}>
            {submitting ? copy.paying : `${copy.pay} ${formatPence(totals.totalPence)} →`}
          </button>
          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}
          <p className={styles.fine}>{copy.secure}</p>
          <p className={styles.fine}>{copy.allergyNote}</p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  full,
  ...input
}: {
  label: string;
  hint?: string;
  error?: string;
  full?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`${styles.field} ${full ? styles.full : ""}`}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} aria-invalid={!!error} {...input} />
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
