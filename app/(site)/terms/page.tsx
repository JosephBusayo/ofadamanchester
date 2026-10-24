import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Terms & refunds" };

// TODO(client): template written for this site's setup — have the owner review it (not legal advice).
export default function TermsPage() {
  return (
    <DocPage eyebrow="LEGAL" title="TERMS & REFUNDS" updated={site.legalUpdated}>
      <p>
        These terms apply when you order from {site.legalName} through this website. Please read them before you pay.
      </p>

      <h2>YOUR ORDER</h2>
      <p>
        Your order is accepted once your payment is confirmed and we send you a confirmation email. If we can&apos;t fulfil
        an order (for example an item has sold out), we&apos;ll contact you and refund anything we can&apos;t provide.
      </p>
      <p>
        Some items are only available on certain days — for example MoiMoi is Saturdays only. The checkout will only let you
        choose a day when everything in your cart is available.
      </p>

      <h2>PRICES & PAYMENT</h2>
      <p>
        Prices are in pounds sterling and include VAT where it applies. The delivery fee is based on the distance from our
        kitchen and is shown before you pay. Payment is taken in full at checkout by Stripe.
      </p>

      <h2>PICKUP & DELIVERY</h2>
      <ul>
        <li>
          <strong>Pickup:</strong> please collect at the time you chose. Food is cooked fresh for that time and is best
          enjoyed straight away.
        </li>
        <li>
          <strong>Delivery:</strong> times are our best estimate. Please make sure your address and mobile number are
          correct and that someone is available to receive the order. If we can&apos;t deliver because the details are
          wrong or nobody is available, we may not be able to refund the order.
        </li>
      </ul>

      <h2>CANCELLATIONS & REFUNDS</h2>
      <p>
        Because our food is perishable and made to order, the 14-day cancellation right under the Consumer Contracts
        Regulations 2013 doesn&apos;t apply. But we want you to be happy:
      </p>
      <ul>
        <li>
          <strong>Changed your mind?</strong> Message us on WhatsApp {site.whatsapp.display} as soon as possible. If we
          haven&apos;t started preparing your order, we&apos;ll cancel it and refund you in full.
        </li>
        <li>
          <strong>Something wrong?</strong> If an item is missing, incorrect or not as it should be, tell us within 24 hours
          (a photo helps) and we&apos;ll put it right with a replacement or refund.
        </li>
        <li>Refunds go back to the card you paid with and usually arrive within 5–10 working days.</li>
      </ul>
      <p>This doesn&apos;t affect your statutory rights.</p>

      <h2>ALLERGIES</h2>
      <p>
        Allergen information for every dish is on our <Link href="/allergens">allergens page</Link> and on each item&apos;s
        page. Our kitchen handles all 14 major allergens, so we can&apos;t guarantee that any dish is free from traces. If you
        have an allergy, please contact us before ordering.
      </p>

      <h2>OUR RESPONSIBILITY</h2>
      <p>
        We&apos;re responsible for providing your order with reasonable care and skill. Nothing in these terms limits our
        liability for death or personal injury caused by our negligence, for fraud, or for anything else that can&apos;t be
        limited by law.
      </p>

      <h2>CONTACT & LAW</h2>
      <p>
        Questions or complaints: <a href={`mailto:${site.email}`}>{site.email}</a> or WhatsApp {site.whatsapp.display}. These
        terms are governed by the law of England and Wales.
      </p>
    </DocPage>
  );
}
