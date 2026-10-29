"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { receipt } from "@/content/home";
import styles from "./Receipt.module.css";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const SWAP_MS = 380;

export function Receipt() {
  const sectionRef = useRef<HTMLElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [printed, setPrinted] = useState(0); // 0 → 1 as the receipt "prints"
  const [receiptHeight, setReceiptHeight] = useState(0);
  const [order, setOrder] = useState(() => receipt.photos.map((_, i) => i)); // photo indices, front first
  const [leaving, setLeaving] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  // Live date/time on the receipt (client only, to avoid hydration mismatches).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock after mount
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useIsoLayoutEffect(() => {
    const el = receiptRef.current;
    if (!el) return;
    const measure = () => setReceiptHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  // Print the receipt out of the slot as the section scrolls into view.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show the full receipt immediately
      setPrinted(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const vh = innerHeight;
      const p = (vh * 0.9 - section.getBoundingClientRect().top) / (vh * 0.55);
      setPrinted(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const nextPhoto = () => {
    if (leaving !== null) return;
    setLeaving(order[0]);
    setTimeout(() => {
      setOrder((o) => [...o.slice(1), o[0]]);
      setLeaving(null);
    }, SWAP_MS);
  };

  const showPhoto = (index: number) => {
    if (leaving !== null || order[0] === index) return;
    setLeaving(order[0]);
    setTimeout(() => {
      setOrder((o) => [index, ...o.filter((i) => i !== index)]);
      setLeaving(null);
    }, SWAP_MS);
  };

  const clipHeight = receiptHeight ? Math.round(receiptHeight * printed + 26 * printed) : 0;
  const date = now
    ? now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "--/--/----";
  const time = now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const title = receipt.title.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? <em key={i}>{part.slice(1, -1)}</em> : <Fragment key={i}>{part}</Fragment>,
  );

  return (
    <section ref={sectionRef} className={styles.rs}>
      <div className={styles.grid}>
        <div className={styles.stackCol}>
          <div
            className={styles.stack}
            role="button"
            tabIndex={0}
            aria-label="Show next photo"
            onClick={nextPhoto}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                nextPhoto();
              }
            }}
          >
            <span className={`${styles.tape} ${styles.tapeA}`} />
            <span className={`${styles.tape} ${styles.tapeB}`} />
            {receipt.photos.map((photo, i) => (
              <figure
                key={photo.src}
                className={`${styles.pol} ${leaving === i ? styles.isLeaving : ""}`}
                data-pos={order.indexOf(i)}
              >
                <div className={styles.polImage}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 900px) 40vw, 86vw"
                    unoptimized={photo.src.endsWith(".svg")}
                    draggable={false}
                  />
                </div>
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className={styles.under}>
            <button type="button" className={styles.hint} onClick={nextPhoto}>
              {receipt.hint}
            </button>
            <div className={styles.dots}>
              {receipt.photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  className={order[0] === i ? styles.on : undefined}
                  onClick={() => showPhoto(i)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.side}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.printer}>
            <div className={styles.slot} aria-hidden />
            <div className={styles.clip} style={{ height: receiptHeight ? clipHeight : printed >= 1 ? "auto" : 0 }}>
              <div
                ref={receiptRef}
                className={styles.receipt}
                role="img"
                aria-label={`${receipt.storeName} receipt: ${receipt.lines
                  .map((l) => `${l.qty} ${l.label}`)
                  .join(", ")}. ${receipt.totalLabel}: ${receipt.totalValue}.`}
              >
                <div className={`${styles.center} ${styles.store}`}>{receipt.storeName}</div>
                <div className={`${styles.center} ${styles.muted}`}>{receipt.storeAddress}</div>
                <hr className={styles.dash} />
                <div className={styles.meta}>
                  <span>{date}</span>
                  <span>{time}</span>
                </div>
                <div className={styles.meta}>
                  <span>{receipt.tableLine}</span>
                </div>
                <hr className={styles.dash} />
                {receipt.lines.map((line) => (
                  <div
                    key={line.label}
                    className={`${styles.line} ${line.qty.trim().startsWith("0") ? styles.isZero : ""}`}
                  >
                    <span className={styles.q}>{line.qty}</span>
                    <span className={styles.l}>{line.label}</span>
                    <span className={styles.m}>{line.mark}</span>
                  </div>
                ))}
                <hr className={styles.dash} />
                <div className={styles.total}>
                  <span>{receipt.totalLabel}:</span>
                  <span>{receipt.totalValue}</span>
                </div>
                <hr className={styles.dash} />
                <Barcode seed={receipt.storeName + receipt.totalValue} />
                <div className={`${styles.center} ${styles.muted}`}>{receipt.footer}</div>
                <div className={`${styles.stamp} ${printed > 0.97 ? styles.on : ""}`}>{receipt.stamp}</div>
              </div>
            </div>
          </div>
          <p className={styles.body}>{receipt.body}</p>
          <div className={styles.actions}>
            <Link href={receipt.cta.href} className={styles.cta}>
              <span>{receipt.cta.label}</span>
              <b aria-hidden>→</b>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Deterministic pseudo-random barcode so server and client render the same bars.
function Barcode({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: React.ReactNode[] = [];
  for (let i = 0, x = 0; x < 300; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const w = 1 + ((h >>> 8) % 4);
    const gap = 1 + ((h >>> 16) % 3);
    bars.push(<rect key={i} x={x} y={0} width={w} height={46} fill="var(--ink)" />);
    x += w + gap;
  }
  return (
    <svg className={styles.barcode} viewBox="0 0 300 46" preserveAspectRatio="none" aria-hidden>
      {bars}
    </svg>
  );
}
