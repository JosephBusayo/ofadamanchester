"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { manifesto } from "@/content/home";
import { ArrowIcon } from "./ArrowIcon";
import styles from "./Manifesto.module.css";

// Sticker positions relative to the quote (from the Framer component).
// "sides" (home): left-top, right-top, left-bottom, right-bottom.
// "scatter" (Our Story): over and around the text.
const POSITIONS = {
  sides: [
    { x: -21, y: -24, r: -10 },
    { x: 104, y: -10, r: 8 },
    { x: -17, y: 60, r: 7 },
    { x: 106, y: 68, r: -9 },
  ],
  scatter: [
    { x: 6, y: -22, r: -12 },
    { x: 80, y: 22, r: -8 },
    { x: 25, y: 48, r: 10 },
    { x: 58, y: 88, r: 9 },
  ],
};
const OVAL_TILT = [0, 3, -2, 2];

const TONES = {
  primary: { fill: "var(--primary)", text: "var(--on-primary)" },
  accent: { fill: "var(--accent)", text: "var(--ink)" },
  ink: { fill: "var(--ink)", text: "var(--on-primary)" },
} as const;

export type ManifestoContent = {
  marquee?: string[];
  /** A blank line starts a new paragraph. */
  quote: string;
  badges: readonly { label: string; tone: keyof typeof TONES }[];
  cta?: { label: string; href: string };
};

export function Manifesto({
  content = manifesto,
  layout = "sides",
}: {
  content?: ManifestoContent;
  layout?: "sides" | "scatter";
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const [isIn, setIsIn] = useState(false);
  const [progress, setProgress] = useState(0);

  // Pop the stickers in once a quarter of the section is visible.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIn(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll-linked marquee drift + word-by-word quote reveal.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show the full quote immediately
      setProgress(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = innerHeight;
      const section = sectionRef.current;
      const track = trackRef.current;
      if (section && track) {
        const shift = (vh - section.getBoundingClientRect().top) * 0.45;
        track.style.transform = `translate3d(${-shift.toFixed(1)}px,0,0)`;
      }
      const quote = quoteRef.current;
      if (quote) {
        const r = quote.getBoundingClientRect();
        setProgress(Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35))));
      }
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

  const paragraphs = content.quote.split(/\n\s*\n/).map((p) => p.split(/\s+/).filter(Boolean));
  const wordCount = paragraphs.flat().length;
  let wordIndex = 0;
  const marqueeCopy = (copy: number) =>
    (content.marquee ?? []).map((item) => (
      <Fragment key={`${copy}-${item}`}>
        <span className={styles.word}>{item}</span>
        <span className={styles.star} aria-hidden>
          ★
        </span>
      </Fragment>
    ));

  return (
    <section
      ref={sectionRef}
      className={`${styles.ms} ${layout === "scatter" ? styles.scatter : ""} ${isIn ? styles.isIn : ""}`}
    >
      <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="msShine" cx="35%" cy="25%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity=".35" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".18" />
          </radialGradient>
        </defs>
      </svg>

      {content.marquee?.length ? (
        <div className={styles.marquee} aria-label={content.marquee.join(", ")}>
          <div className={styles.track} ref={trackRef} aria-hidden>
            {[0, 1, 2, 3].map(marqueeCopy)}
          </div>
        </div>
      ) : null}

      <div className={styles.wrap}>
        <div className={styles.stickers} aria-hidden>
          {content.badges.slice(0, 4).map((badge, i) => {
            const pos = POSITIONS[layout][i];
            const tone = TONES[badge.tone];
            return (
              <div
                key={badge.label}
                className={styles.st}
                style={
                  {
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    "--r": `${pos.r}deg`,
                    "--d": `${0.15 + i * 0.12}s`,
                    "--fd": `${4.4 + (i % 3) * 0.7}s`,
                    "--fdl": `${-i * 0.9}s`,
                  } as React.CSSProperties
                }
              >
                <div className={styles.pop}>
                  <div className={styles.float}>
                    <div className={styles.blob}>
                      <svg viewBox="0 0 120 80">
                        <g transform={`rotate(${OVAL_TILT[i % 4]} 60 40)`}>
                          <ellipse cx="60" cy="40" rx="57" ry="37" fill="var(--bg-alt)" />
                          <ellipse cx="60" cy="40" rx="51.5" ry="31.5" fill={tone.fill} />
                          <ellipse cx="60" cy="40" rx="51.5" ry="31.5" fill="url(#msShine)" opacity=".5" />
                        </g>
                        <path d="M30 57 C48 53 70 51 93 50" stroke={tone.text} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                        <path d="M38 62.5 C54 59.5 70 58 86 57.5" stroke={tone.text} strokeWidth="2" strokeLinecap="round" fill="none" opacity=".9" />
                      </svg>
                      <span style={{ color: tone.text }}>{badge.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p ref={quoteRef} className={styles.quote} aria-label={content.quote}>
          {paragraphs.map((para, pi) => (
            <Fragment key={pi}>
              {pi > 0 && "\n\n"}
              {para.map((word) => {
                const i = wordIndex++;
                return (
                  <Fragment key={i}>
                    <span
                      className={styles.w}
                      aria-hidden
                      style={{ opacity: i / wordCount < progress * 1.08 ? 1 : 0.16 }}
                    >
                      {word}
                    </span>{" "}
                  </Fragment>
                );
              })}
            </Fragment>
          ))}
        </p>
      </div>

      {content.cta && (
        <div className={styles.cta}>
          <Link href={content.cta.href}>
            <span>{content.cta.label}</span>
            <ArrowIcon />
          </Link>
        </div>
      )}
    </section>
  );
}
