"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { cartCopy } from "@/content/cart";
import { useCart } from "@/lib/cart";
import type { Menu } from "@/lib/menu/types";
import { MAX_LINE_QTY, formatPence, priceCart } from "@/lib/pricing";
import styles from "./CartDrawer.module.css";

const FALLBACK_IMAGE = "/placeholders/product.svg";

export function CartDrawer({ menu }: { menu: Menu }) {
  const { lines, isOpen, close, setQty, removeLine } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const priced = useMemo(() => priceCart(lines, menu), [lines, menu]);
  const pricedByIndex = new Map(priced.lines.map((l) => [l.index, l]));

  // Lock page scroll, close on Escape, and move focus into the sheet while open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [isOpen, close]);

  const hasLines = lines.length > 0;
  const canCheckout = priced.lines.length > 0 && priced.issues.length === 0;

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.open : ""}`} onClick={close} aria-hidden />
      <aside
        className={`${styles.sheet} ${isOpen ? styles.open : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        inert={!isOpen}
      >
        <div className={styles.head}>
          <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Close cart">
            ×
          </button>
          <p className={styles.kicker}>{cartCopy.kicker}</p>
          <h2 id="cart-title" className={styles.title}>
            {hasLines ? cartCopy.title : cartCopy.emptyTitle}
          </h2>
        </div>

        <div className={styles.body}>
          {hasLines ? (
            <ul className={styles.list}>
              {lines.map((line, index) => {
                const p = pricedByIndex.get(index);
                const product = p?.product ?? menu.categories.flatMap((c) => c.products).find((x) => x.slug === line.productSlug);
                const image = product?.image ?? FALLBACK_IMAGE;
                const details = p
                  ? [
                      ...p.options.map((o) => o.name),
                      ...p.extras.map((e) => `+ ${e.qty > 1 ? `${e.qty}× ` : ""}${e.name}`),
                    ]
                  : [];
                const saturdayOnly = product?.availableDays?.length === 1 && product.availableDays[0] === 6;
                return (
                  <li key={line.key} className={`${styles.item} ${p ? "" : styles.bad}`}>
                    <div className={styles.thumb}>
                      <Image src={image} alt="" fill sizes="56px" unoptimized={image.endsWith(".svg")} />
                    </div>
                    <div className={styles.txt}>
                      <span className={styles.name}>{product?.name ?? line.productSlug}</span>
                      {details.length > 0 && <span className={styles.note}>{details.join(" · ")}</span>}
                      {saturdayOnly && <span className={styles.note}>{cartCopy.saturdayOnly}</span>}
                      {!p && <span className={styles.warn}>{cartCopy.unavailable}</span>}
                    </div>
                    <span className={styles.price}>{p ? formatPence(p.totalPence) : "—"}</span>
                    <div className={styles.actions}>
                      {p ? (
                        <div className={styles.stepper} role="group" aria-label={`Quantity of ${p.product.name}`}>
                          <button
                            type="button"
                            aria-label={line.qty === 1 ? `Remove ${p.product.name}` : `Fewer ${p.product.name}`}
                            onClick={() => setQty(line.key, line.qty - 1)}
                          >
                            −
                          </button>
                          <output aria-live="polite">{line.qty}</output>
                          <button
                            type="button"
                            aria-label={`More ${p.product.name}`}
                            disabled={line.qty >= MAX_LINE_QTY}
                            onClick={() => setQty(line.key, line.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span />
                      )}
                      <button type="button" className={styles.remove} onClick={() => removeLine(line.key)}>
                        {cartCopy.remove}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>{cartCopy.emptyBody}</p>
              <Link href="/menu" className={`${styles.btn} ${styles.btnPrimary} w-full`} onClick={close}>
                {cartCopy.viewMenu}
              </Link>
            </div>
          )}
        </div>

        {hasLines && (
          <div className={styles.foot}>
            <div className={styles.sep}>{cartCopy.separator}</div>
            <div className={styles.subtotal}>
              <span>{cartCopy.subtotal}</span>
              <span>{formatPence(priced.subtotalPence)}</span>
            </div>
            <div className={styles.buttons}>
              {canCheckout ? (
                <Link href="/checkout" className={`${styles.btn} ${styles.btnPrimary}`} onClick={close}>
                  {cartCopy.checkout} · {formatPence(priced.subtotalPence)} →
                </Link>
              ) : (
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled aria-disabled>
                  {cartCopy.checkout}
                </button>
              )}
              <button type="button" className={styles.btn} onClick={close}>
                {cartCopy.keepBrowsing}
              </button>
            </div>
            <p className={styles.footNote}>{cartCopy.foot}</p>
          </div>
        )}
      </aside>
    </>
  );
}
