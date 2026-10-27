"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = { src: string; alt: string };

/**
 * Cross-fading photo carousel that fills its (relatively positioned) parent.
 * - Advances every `intervalMs` (3 s); pauses while hovered or focused.
 * - `interactive`: dots are buttons. Leave it off inside a link (e.g. a product card),
 *   where nested buttons aren't allowed — the dots are then just indicators.
 * - Reduced motion: still advances (the client wants both photos seen) but without the fade.
 */
export function ImageCarousel({
  images,
  sizes,
  fit = "cover",
  priority = false,
  interactive = false,
  intervalMs = 3000,
  decorative = false,
}: {
  images: Slide[];
  sizes: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  interactive?: boolean;
  intervalMs?: number;
  /** Alt text off (the surrounding link/heading already names the product). */
  decorative?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [paused, count, intervalMs]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription={interactive ? "carousel" : undefined}
    >
      {images.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={decorative ? "" : img.alt}
          aria-hidden={i !== index || undefined}
          fill
          sizes={sizes}
          priority={priority && i === 0}
          className={`${fit === "cover" ? "object-cover" : "object-contain"} transition-opacity duration-700 ease-out motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-2.5 z-[1] flex justify-center gap-1.5">
          {images.map((img, i) =>
            interactive ? (
              <button
                key={img.src}
                type="button"
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index || undefined}
                onClick={() => setIndex(i)}
                className={`size-2.5 rounded-full border border-on-primary transition-colors ${
                  i === index ? "bg-primary" : "bg-on-primary/70 hover:bg-on-primary"
                }`}
              />
            ) : (
              <span
                key={img.src}
                aria-hidden
                className={`size-2 rounded-full border border-on-primary ${i === index ? "bg-primary" : "bg-on-primary/70"}`}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
