import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Cookies" };

// TODO(client): review. If analytics or marketing tools are ever added, this page and a
// consent banner must be updated first.
export default function CookiesPage() {
  return (
    <DocPage eyebrow="LEGAL" title="COOKIES" updated={site.legalUpdated}>
      <p>
        We keep this simple: this website <strong>doesn&apos;t use any advertising, analytics or tracking cookies</strong>.
        We only store what&apos;s strictly needed for the site to work, so there&apos;s no cookie banner.
      </p>

      <h2>WHAT WE STORE</h2>
      <ul>
        <li>
          <strong>Your cart</strong> — saved in your browser&apos;s local storage so it&apos;s still there if you refresh the
          page. It never leaves your device until you check out.
        </li>
        <li>
          <strong>Payment</strong> — when you pay, Stripe&apos;s secure checkout page may set its own cookies to prevent fraud.
          See{" "}
          <a href="https://stripe.com/gb/legal/cookies-policy" target="_blank" rel="noopener noreferrer">
            Stripe&apos;s cookie policy
          </a>
          .
        </li>
        <li>
          <strong>Staff login</strong> — our admin area uses a login cookie. This only applies to our team, not customers.
        </li>
      </ul>

      <h2>CONTROLLING COOKIES</h2>
      <p>
        You can clear cookies and site data in your browser settings at any time. Clearing them will empty your cart.
      </p>

      <h2>MORE</h2>
      <p>
        See our <Link href="/privacy">privacy policy</Link> or contact us at <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </DocPage>
  );
}
