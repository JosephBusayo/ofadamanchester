import Image from "next/image";
import Link from "next/link";
import { ImageCarousel } from "./ImageCarousel";

const FALLBACK_IMAGE = "/placeholders/product.svg";

// Tan menu card used on the home bestsellers, menu page and "You may also like".
export function ProductCard({
  href,
  name,
  price,
  image,
  badge,
  soldOut = false,
  gallery,
}: {
  href: string;
  name: string;
  price: string;
  image: string | null;
  badge?: string | null;
  soldOut?: boolean;
  /** Two or more photos → auto-playing carousel instead of `image`. */
  gallery?: { src: string; alt: string }[];
}) {
  const src = image ?? FALLBACK_IMAGE;
  return (
    <Link
      href={href}
      className="relative flex h-[380px] flex-col items-center gap-6 rounded-2xl bg-bg-alt px-6 pb-6 pt-[42px]"
    >
      <div className={`relative size-[244px] shrink-0 ${soldOut ? "opacity-50 grayscale" : ""}`}>
        {gallery && gallery.length > 1 ? (
          <ImageCarousel images={gallery} sizes="244px" decorative />
        ) : (
          <Image src={src} alt="" fill sizes="244px" className="object-cover" unoptimized={src.endsWith(".svg")} />
        )}
      </div>
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <h3 className="text-base font-bold leading-[1.15] text-ink">{name}</h3>
        <p className="text-sm font-bold leading-[1.1] text-highlight">{soldOut ? "SOLD OUT" : price}</p>
      </div>
      {badge && (
        <span className="absolute left-3.5 top-3.5 flex h-[42px] min-w-[42px] items-center justify-center rounded-full bg-primary px-3 text-sm font-bold leading-[1.2] text-on-primary">
          {badge}
        </span>
      )}
    </Link>
  );
}
