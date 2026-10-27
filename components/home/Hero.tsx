"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { hero } from "@/content/home";
import styles from "./Hero.module.css";
import { StickerNumberOne, StickerOval } from "./Stickers";

// useLayoutEffect warns during SSR; fall back to useEffect there.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TITLE_LINE_HEIGHT = 0.84;
const IMAGE_OVERLAP = 0.34; // fraction of the headline height the image rises into

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(0);

  // Fit the three words to the full container width (same algorithm as Framer).
  useIsoLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const fit = () => {
      const width = el.clientWidth;
      if (!width) return;
      el.style.fontSize = "100px";
      const words = Array.from(el.children) as HTMLElement[];
      const stacked = getComputedStyle(el).flexDirection === "column";
      const natural = stacked
        ? Math.max(...words.map((w) => w.scrollWidth))
        : words.reduce((sum, w) => sum + w.scrollWidth, 0) + 10 * (words.length - 1);
      const size = Math.max(24, Math.floor(((100 * width) / Math.max(natural, 1)) * 0.99));
      el.style.fontSize = `${size}px`;
      setFontSize(size);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener("loadingdone", fit);
    return () => {
      ro.disconnect();
      document.fonts?.removeEventListener("loadingdone", fit);
    };
  }, []);

  // Mouse parallax on desktop: each [data-depth] layer drifts by its depth in px.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      matchMedia("(hover: none)").matches
    )
      return;
    const layers = Array.from(section.querySelectorAll<HTMLElement>("[data-depth]"));
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    const tick = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      for (const layer of layers) {
        const depth = parseFloat(layer.dataset.depth || "0");
        layer.style.transform = `translate3d(${(x * depth).toFixed(2)}px, ${(y * depth).toFixed(2)}px, 0)`;
      }
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: MouseEvent) => {
      targetX = (e.clientX / innerWidth) * 2 - 1;
      targetY = (e.clientY / innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    addEventListener("mousemove", onMove, { passive: true });
    return () => {
      removeEventListener("mousemove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const overlap = -(fontSize * TITLE_LINE_HEIGHT * IMAGE_OVERLAP);
  const tickerGroup = (key: string) => (
    <div className={styles.group} aria-hidden={key === "b"} key={key}>
      {hero.ticker.map((item) => (
        <Fragment key={item}>
          <span className={styles.item}>{item}</span>
          <span className={styles.star}>★</span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className={styles.hs}
      style={{ "--overlap": `${overlap}px` } as React.CSSProperties}
    >
      <div className={styles.grain} aria-hidden />
      <div className={styles.inner}>
        <h1 ref={titleRef} className={`${styles.title} ${fontSize ? styles.isFit : ""}`}>
          {hero.words.map((word, i) => (
            <span key={word} className={hero.accentWord === i + 1 ? styles.accent : undefined}>
              {word}
            </span>
          ))}
        </h1>

        <div className={styles.stage}>
          <div className={styles.copy}>
            <p>{hero.subtitle}</p>
            <div className={styles.btns}>
              <Link href={hero.primary.href} className={`${styles.btn} ${styles.btnPrimary}`}>
                {hero.primary.label}
              </Link>
              <Link href={hero.secondary.href} className={`${styles.btn} ${styles.btnGhost}`}>
                {hero.secondary.label}
              </Link>
            </div>
          </div>

          <div className={styles.art}>
            <div className={styles.layer} data-depth="6">
              <Image
                className={styles.image}
                src={hero.image.src}
                alt={hero.image.alt}
                width={hero.image.width}
                height={hero.image.height}
                priority
                unoptimized={hero.image.src.endsWith(".svg")}
                sizes="100vw"
              />
            </div>
            <Sticker className={styles.s1} depth={38}>
              <StickerNumberOne label={hero.stickers.one} />
            </Sticker>
            <Sticker className={styles.s2} depth={30}>
              <StickerOval label={hero.stickers.new} tone="primary" icon="crown" />
            </Sticker>
            <Sticker className={styles.s3} depth={46}>
              <StickerOval label={hero.stickers.hot} tone="accent" icon="flame" />
            </Sticker>
          </div>
        </div>
      </div>

      <div className={styles.ticker} role="marquee" aria-label={hero.ticker.join(", ")}>
        <div className={styles.track}>{["a", "b"].map(tickerGroup)}</div>
      </div>
    </section>
  );
}

function Sticker({
  className,
  depth,
  children,
}: {
  className: string;
  depth: number;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.sticker} ${className}`}>
      <div className={styles.layer} data-depth={depth}>
        <div className={styles.pop}>
          <div className={styles.float}>{children}</div>
        </div>
      </div>
    </div>
  );
}
