import Link from "next/link";
import { footer, legalLinks, site } from "@/content/site";
import { NewsletterForm } from "./NewsletterForm";

const headingClass = "text-lg font-semibold leading-[1.1] tablet:text-[22px]";
const linkClass =
  "block text-[17px] leading-[20px] transition-opacity hover:opacity-60 tablet:text-xl tablet:leading-6";

export function Footer() {
  return (
    <footer className="bg-bg px-5 pb-6 pt-14 text-ink tablet:px-8 tablet:pt-[72px] desktop:px-12 desktop:pt-24">
      <div className="grid grid-cols-2 gap-x-5 gap-y-9 tablet:grid-cols-3 tablet:gap-x-8 tablet:gap-y-10 desktop:grid-cols-[340px_200px_200px_1fr_260px]">
        {/* Address */}
        <div className="col-span-2 flex gap-3.5 tablet:col-span-3 tablet:gap-5 desktop:col-span-1">
          <svg
            className="size-7 shrink-0 tablet:size-9"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 1.5a8 8 0 0 0-8 8c0 5.6 6.6 12.2 7.3 12.9a1 1 0 0 0 1.4 0c.7-.7 7.3-7.3 7.3-12.9a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
          </svg>
          <div>
            <p className="text-lg font-semibold leading-[1.15] tablet:text-[22px]">
              {site.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-block text-lg leading-[26px] hover:opacity-60"
            >
              {site.email}
            </a>
          </div>
        </div>

        <FooterLinks title={footer.quickLinks.title} links={footer.quickLinks.links} />
        <FooterLinks title={footer.social.title} links={footer.social.links} external />

        {/* Newsletter (desktop: last column, leaving the 4th column empty as in Framer) */}
        <div className="col-span-2 tablet:col-span-3 tablet:max-w-[420px] desktop:col-span-1 desktop:col-start-5">
          <h3 className={headingClass}>{footer.newsletter.title}</h3>
          <p className="mt-1 text-[17px] leading-[22px] tablet:mt-[15px] tablet:text-xl tablet:leading-[26px]">
            {footer.newsletter.body}
          </p>
          <NewsletterForm />
        </div>
      </div>

      <FooterWordmark />

      {/* Not in the Framer footer — added so the legal pages are linked from every page. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm opacity-70">
        <span>
          © {site.legalUpdated.slice(-4)} {site.legalName}
        </span>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
          {legalLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
  external = false,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
  external?: boolean;
}) {
  return (
    <nav aria-label={title}>
      <h3 className={headingClass}>{title}</h3>
      <div className="mt-4 flex flex-col gap-2.5 tablet:mt-[27px] tablet:gap-3">
        {links.map((link) =>
          external ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {link.label}
            </a>
          ) : (
            <Link key={link.label} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}

// Giant full-width wordmark at the bottom of the footer. Text stretched to the
// container width via SVG textLength — swap for the client's logo SVG later.
function FooterWordmark() {
  return (
    <div className="mt-11 tablet:mt-14 desktop:mt-[73px]" aria-hidden>
      <svg viewBox="0 0 1000 214" className="block h-auto w-full text-primary">
        <text
          x="0"
          y="207"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
          fill="currentColor"
          style={{ fontFamily: "var(--font-bowlby)", fontSize: 286 }}
        >
          {site.wordmark}
        </text>
      </svg>
    </div>
  );
}
