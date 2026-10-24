import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, docStyles } from "@/components/DocPage";
import { site } from "@/content/site";
import { UK_ALLERGENS, allergenNames } from "@/lib/menu/allergens";
import { getMenu } from "@/lib/menu/get-menu";

export const metadata: Metadata = {
  title: "Allergens",
  description: "Allergen information for every item on the Ofada Manchester menu (the 14 UK allergens).",
};

export default async function AllergensPage() {
  const menu = await getMenu();
  const anyUnconfirmed = menu.categories.some((c) => c.products.some((p) => p.allergens === null));

  return (
    <DocPage
      eyebrow="ALLERGEN INFORMATION"
      title="ALLERGENS"
      notice={
        <>
          <strong>Have an allergy?</strong> Please message us on{" "}
          <a className="underline" href={site.whatsapp.href}>
            WhatsApp {site.whatsapp.display}
          </a>{" "}
          <strong>before you order</strong>. Our kitchen handles all 14 allergens, so we can&apos;t guarantee any dish is
          free from traces.
          {anyUnconfirmed && <> Items marked &ldquo;being confirmed&rdquo; are still being checked by our kitchen.</>}
        </>
      }
    >
      <p>
        UK law lists 14 allergens that food businesses must tell you about. This page shows which of them are in each dish on
        our menu. You&apos;ll also find this on each item&apos;s page before you add it to your cart.
      </p>

      {menu.categories.map((category) => (
        <section key={category.slug}>
          <h2>{category.name}</h2>
          {category.products.map((p) => (
            <div key={p.slug} className={docStyles.row}>
              <Link href={`/menu/${p.slug}`} className="font-normal no-underline hover:underline">
                {p.name}
              </Link>
              {p.allergens === null ? (
                <span className={docStyles.muted}>Being confirmed</span>
              ) : (
                <span>{p.allergens.length ? allergenNames(p.allergens).join(", ") : "None of the 14"}</span>
              )}
            </div>
          ))}
        </section>
      ))}

      <h2>THE 14 ALLERGENS</h2>
      <ul className={docStyles.chips}>
        {Object.values(UK_ALLERGENS).map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <p>
        Extras you add (such as fried fish or a boiled egg) bring their own allergens — check them in the list above. If
        you&apos;re unsure about anything, ask us before ordering.
      </p>
    </DocPage>
  );
}
