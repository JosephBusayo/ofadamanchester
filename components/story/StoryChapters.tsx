"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { StoryChapter } from "@/content/our-story";
import styles from "./Story.module.css";

const MEDIA_CLASS = { a: styles.mediaA, b: styles.mediaB, c: styles.mediaC, d: styles.mediaD };

/** Text + photo rows that fade up as they scroll into view. */
export function StoryChapters({ chapters }: { chapters: StoryChapter[] }) {
  return (
    <section className={styles.sc}>
      <div className={styles.list}>
        {chapters.map((chapter) => (
          <Chapter key={chapter.title} chapter={chapter} />
        ))}
      </div>
    </section>
  );
}

function Chapter({ chapter }: { chapter: StoryChapter }) {
  const ref = useRef<HTMLElement>(null);
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article ref={ref} className={`${styles.row} ${isIn ? styles.isIn : ""}`}>
      <h2 className={styles.title}>{chapter.title}</h2>
      <div className={styles.body}>
        {chapter.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {chapter.images.length > 0 && (
        <div className={`${styles.media} ${MEDIA_CLASS[chapter.layout]}`}>
          {chapter.images.map((img) => (
            <div key={img.src} className={styles.ph}>
              <Image src={img.src} alt={img.alt} fill sizes="(min-width: 760px) 33vw, 100vw" unoptimized={img.src.endsWith(".svg")} />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
