import Link from "next/link";
import { site } from "@/content/site";

// Text wordmark until the client's logo arrives — swap the <span> for the logo SVG/image.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} — home`}
      className={`inline-flex items-center font-wordmark leading-none text-primary ${className}`}
    >
      <span aria-hidden>{site.wordmark}</span>
    </Link>
  );
}
