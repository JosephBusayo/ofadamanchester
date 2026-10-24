"use client";

import { useEffect, useRef, useState } from "react";
import { MENU_SCROLL_OFFSET } from "@/lib/menu/constants";
import styles from "./MenuFilter.module.css";

/** Sticky category pills with scroll-spy (ported from the Framer filter component). */
export function MenuFilter({ items }: { items: { slug: string; label: string }[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(items[0]?.slug ?? "");

  // Scroll-spy: the active pill is the last category whose top has passed the offset.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = items[0]?.slug ?? "";
      for (const item of items) {
        const el = document.getElementById(item.slug);
        if (el && el.getBoundingClientRect().top - MENU_SCROLL_OFFSET - 24 <= 0) current = item.slug;
      }
      setActive(current);
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
  }, [items]);

  // Arriving with #category in the URL (e.g. from an item page) → smooth-scroll to it.
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash || !items.some((i) => i.slug === hash)) return;
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - MENU_SCROLL_OFFSET, behavior: "smooth" });
    }, 300);
    return () => clearTimeout(t);
  }, [items]);

  // Keep the active pill centred when the row scrolls horizontally (phones).
  useEffect(() => {
    const nav = navRef.current;
    const pill = nav?.querySelector<HTMLElement>(`[data-target="${active}"]`);
    if (nav && pill && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: pill.offsetLeft - nav.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
    }
  }, [active]);

  const jump = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    const el = document.getElementById(slug);
    if (!el) return;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - MENU_SCROLL_OFFSET, behavior: "smooth" });
    history.replaceState(null, "", `#${slug}`);
    setActive(slug);
  };

  return (
    <div className={styles.wrap}>
      <nav ref={navRef} className={styles.nav} aria-label="Menu categories">
        {items.map((item) => (
          <a
            key={item.slug}
            href={`#${item.slug}`}
            data-target={item.slug}
            className={active === item.slug ? styles.active : undefined}
            aria-current={active === item.slug ? "true" : undefined}
            onClick={(e) => jump(e, item.slug)}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
