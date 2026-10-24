import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Privacy policy" };

// TODO(client): template written for this site's setup — have the owner review it (not legal advice).
export default function PrivacyPage() {
  return (
    <DocPage eyebrow="LEGAL" title="PRIVACY POLICY" updated={site.legalUpdated}>
      <p>
        This policy explains what personal information {site.legalName} (&ldquo;we&rdquo;) collects when you order from
        this website, why, who we share it with and your rights under UK data protection law (UK GDPR and the Data
        Protection Act 2018).
      </p>

      <h2>WHO WE ARE</h2>
      <p>
        {site.legalName} is the data controller. Contact us about your data at{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> or on WhatsApp {site.whatsapp.display}.
      </p>

      <h2>WHAT WE COLLECT</h2>
      <ul>
        <li>
          <strong>Order details:</strong> your name, email address, mobile number, what you ordered, the pickup or delivery
          time you chose and any notes you add.
        </li>
        <li>
          <strong>Delivery details:</strong> your address and postcode, and the distance from our kitchen we work out from
          it.
        </li>
        <li>
          <strong>Allergy information</strong> you choose to tell us in your notes or messages. We only use it to prepare
          your food safely.
        </li>
        <li>
          <strong>Payment:</strong> payments are handled by Stripe. We never see or store your full card number.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address, used briefly to stop abuse of the checkout (rate limiting).
        </li>
      </ul>
      <p>We don&apos;t use advertising or tracking cookies, and you don&apos;t need an account to order.</p>

      <h2>WHY WE USE IT</h2>
      <ul>
        <li>To take, prepare and deliver your order and contact you about it — needed to carry out our contract with you.</li>
        <li>To keep accounting and tax records — a legal obligation.</li>
        <li>To prevent fraud and misuse of the website — our legitimate interests.</li>
        <li>To act on allergy information you give us — with your consent, which you can withdraw by telling us.</li>
      </ul>
      <p>We don&apos;t send marketing messages, and we never sell your information.</p>

      <h2>WHO WE SHARE IT WITH</h2>
      <p>Only the services that run this website and your order:</p>
      <ul>
        <li><strong>Stripe</strong> — card payments.</li>
        <li><strong>Supabase</strong> — stores orders securely.</li>
        <li><strong>Vercel</strong> — hosts the website.</li>
        <li><strong>Resend</strong> — sends your order confirmation email.</li>
        <li><strong>Twilio / WhatsApp</strong> — sends us a notification of your order (name, phone, address and items).</li>
        <li><strong>postcodes.io</strong> — your postcode only, to work out the delivery distance.</li>
        <li><strong>Upstash</strong> — your IP address, briefly, for rate limiting.</li>
        <li>Our delivery driver or courier — your name, address, phone and order, for delivery only.</li>
      </ul>
      <p>
        Some of these providers process data outside the UK (for example in the USA). Where they do, they use approved
        safeguards such as the UK International Data Transfer Addendum or the UK–US Data Bridge.
      </p>

      <h2>HOW LONG WE KEEP IT</h2>
      <ul>
        <li>Order records: 6 years, as required for UK tax purposes.</li>
        <li>Rate-limiting data: a few minutes.</li>
        <li>Your cart: only in your own browser, until you check out or clear it.</li>
      </ul>

      <h2>YOUR RIGHTS</h2>
      <p>
        You can ask to see the information we hold about you, have it corrected or deleted, restrict or object to how we use
        it, or receive a copy to take elsewhere. Some records we must keep by law. Contact us at{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> and we&apos;ll respond within one month.
      </p>
      <p>
        If you&apos;re unhappy with how we&apos;ve handled your data, you can complain to the Information Commissioner&apos;s
        Office: <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a> or 0303 123 1113.
      </p>

      <h2>COOKIES</h2>
      <p>
        See our <Link href="/cookies">cookie notice</Link>.
      </p>

      <h2>CHANGES</h2>
      <p>If we change this policy we&apos;ll update the date at the top of this page.</p>
    </DocPage>
  );
}
