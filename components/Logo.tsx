import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

// Transparent cut-out of the client's logo (design/reference/logo.jpg → public/brand/logo.png).
export const LOGO = { src: "/brand/logo.png", width: 1100, height: 357 } as const;

/** Home link with the logo. Size it with a height class (e.g. "h-14"); width follows. */
export function Logo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label={`${site.name} — home`} className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src={LOGO.src}
        alt=""
        width={LOGO.width}
        height={LOGO.height}
        priority={priority}
        sizes="240px"
        className="h-full w-auto"
      />
    </Link>
  );
}
