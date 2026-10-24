"use client";

import { useEffect, useState } from "react";
import { itemPage } from "@/content/menu";
import { useCart } from "@/lib/cart";
import type { MenuProduct } from "@/lib/menu/types";
import { MAX_EXTRA_QTY as MAX_EXTRA, MAX_LINE_QTY as MAX_QTY, formatPence, priceLine } from "@/lib/pricing";
import styles from "./ItemDetail.module.css";

export function OrderPanel({ product, extras }: { product: MenuProduct; extras: MenuProduct[] }) {
  const { addLine } = useCart();
  const [optionSlugs, setOptionSlugs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      product.optionGroups.filter((g) => g.required && g.options[0]).map((g) => [g.slug, g.options[0].slug]),
    ),
  );
  const [extraQty, setExtraQty] = useState<Record<string, number>>({});
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(t);
  }, [justAdded]);

  const { totalPence } = priceLine(product, { optionSlugs, extras: extraQty, qty }, extras);
  const canAdd = !product.soldOut && product.optionGroups.every((g) => !g.required || optionSlugs[g.slug]);

  const add = () => {
    if (!canAdd) return;
    addLine({
      productSlug: product.slug,
      qty,
      optionSlugs,
      extras: Object.fromEntries(Object.entries(extraQty).filter(([, n]) => n > 0)),
    });
    setJustAdded(true);
    setQty(1);
    setExtraQty({});
  };

  return (
    <div className={styles.panel}>
      {product.optionGroups.map((group) => (
        <fieldset key={group.slug} className={styles.group}>
          <legend className={styles.groupLabel}>{group.name.toUpperCase()}</legend>
          <div className={styles.choices} role="radiogroup" aria-label={group.name}>
            {group.options.map((option) => {
              const selected = optionSlugs[group.slug] === option.slug;
              return (
                <button
                  key={option.slug}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={styles.pill}
                  onClick={() => setOptionSlugs((s) => ({ ...s, [group.slug]: option.slug }))}
                >
                  {option.name}
                  {group.options.some((o) => o.priceDeltaPence !== 0) && (
                    <span className={styles.choicePrice}>{formatPence(product.pricePence + option.priceDeltaPence)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {product.acceptsExtras && extras.length > 0 && (
        <fieldset className={`${styles.group} ${styles.extras}`}>
          <legend className={styles.groupLabel}>{itemPage.extrasTitle}</legend>
          <div>
            {extras.map((extra) => {
              const n = extraQty[extra.slug] ?? 0;
              const set = (v: number) => setExtraQty((s) => ({ ...s, [extra.slug]: v }));
              return (
                <div key={extra.slug} className={styles.row}>
                  <span>
                    {extra.name}
                    <span className={styles.rowPrice}>
                      +{formatPence(extra.pricePence)}
                      {extra.bundle && ` · ${extra.bundle.qty} for ${formatPence(extra.bundle.pricePence)}`}
                    </span>
                  </span>
                  <Stepper
                    label={extra.name}
                    value={n}
                    min={0}
                    max={MAX_EXTRA}
                    onChange={set}
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className={styles.buy}>
        <Stepper label={itemPage.quantity} value={qty} min={1} max={MAX_QTY} onChange={setQty} />
        <button type="button" className={styles.order} onClick={add} disabled={!canAdd}>
          {product.soldOut ? (
            <span>{itemPage.soldOut}</span>
          ) : justAdded ? (
            <span>{itemPage.added}</span>
          ) : (
            <>
              <span>
                {itemPage.addToCart} · {formatPence(totalPence)}
              </span>
              <b aria-hidden>→</b>
            </>
          )}
        </button>
      </div>
      <span className="sr-only" role="status">
        {justAdded ? `${product.name} added to cart` : ""}
      </span>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
