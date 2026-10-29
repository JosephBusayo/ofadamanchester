import type { Metadata } from "next";
import Image from "next/image";
import { MenuFilter } from "@/components/menu/MenuFilter";
import { ProductCard } from "@/components/ProductCard";
import { availabilityNote } from "@/lib/menu/availability";
import { bulkOrders, menuPage, productGalleries } from "@/content/menu";
import { site } from "@/content/site";
import { MENU_SCROLL_OFFSET } from "@/lib/menu/constants";
import { getMenu } from "@/lib/menu/get-menu";
import { formatPence, fromPrice } from "@/lib/pricing";
import { noticeLabel } from "@/lib/schedule";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Menu",
  description: "The Ofada Box, Ofada meal packs, our classic sauce to take home, protein add-ons and sides.",
};

export default async function MenuPage() {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const categories = menu.categories.filter((c) => c.products.length > 0);

  return (
    <>
      <section className="mt-10 flex flex-col items-center gap-5 px-8 pt-6">
        <p className="text-center text-lg font-semibold leading-none tracking-[1.44px] text-highlight">
          {menuPage.eyebrow}
        </p>
        <h1 className="max-w-[1000px] text-center font-wordmark text-[44px] leading-[0.95] tracking-[-0.04em] text-ink tablet:text-[85px] desktop:text-[88px]">
          {menuPage.title}
        </h1>
        <p className="rounded-full bg-accent px-5 py-2 text-center text-sm font-bold leading-tight tracking-[1px] text-on-accent tablet:text-base">
          {menuPage.preorderNote(noticeLabel(settings.leadTimeMinutes))}
        </p>
      </section>

      <div className="mt-10 px-8">
        <div className="relative h-80 overflow-hidden rounded-2xl bg-primary-dark tablet:h-[440px]">
          <Image
            src={menuPage.banner.src}
            alt={menuPage.banner.alt}
            fill
            priority
            sizes="(min-width: 810px) 440px, 100vw"
            className="object-contain"
            unoptimized={menuPage.banner.src.endsWith(".svg")}
          />
        </div>
      </div>

      <div className="pointer-events-none sticky top-20 z-10 mt-10">
        <MenuFilter
          items={[
            ...categories.map((c) => ({ slug: c.slug, label: menuPage.filterLabels[c.slug] ?? c.name })),
            { slug: bulkOrders.slug, label: menuPage.filterLabels[bulkOrders.slug] ?? bulkOrders.title },
          ]}
        />
      </div>

      <div className="mt-10 flex flex-col gap-[72px] px-8 pb-20">
        {categories.map((category) => (
          <section
            key={category.slug}
            id={category.slug}
            className="flex flex-col gap-6"
            style={{ scrollMarginTop: MENU_SCROLL_OFFSET }}
          >
            <h2 className="font-wordmark text-[32px] leading-8 tracking-[-0.96px] text-ink">{category.name}</h2>
            <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
              {category.products.map((p) => {
                const price = fromPrice(p);
                return (
                  <ProductCard
                    key={p.slug}
                    href={`/menu/${p.slug}`}
                    name={p.name}
                    price={`${price.isFrom ? "From " : ""}${formatPence(price.pence)}`}
                    image={p.image}
                    gallery={productGalleries[p.slug]}
                    note={availabilityNote(p.availableDays)}
                    badge={p.badge}
                    soldOut={p.soldOut}
                  />
                );
              })}
            </div>
          </section>
        ))}

        {/* Bulk / party orders: arranged on WhatsApp, not through the cart. */}
        <section id={bulkOrders.slug} className="flex flex-col gap-6" style={{ scrollMarginTop: MENU_SCROLL_OFFSET }}>
          <h2 className="font-wordmark text-[32px] leading-8 tracking-[-0.96px] text-ink">{bulkOrders.title}</h2>
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
            {bulkOrders.images.map((img) => (
              <div key={img.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bg-alt">
                <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-col items-start gap-5 rounded-2xl bg-bg-alt p-6 tablet:flex-row tablet:items-center tablet:justify-between tablet:p-8">
            <p className="max-w-[640px] text-lg leading-relaxed text-ink">{bulkOrders.body}</p>
            <a
              href={`${site.whatsapp.href}?text=${encodeURIComponent(bulkOrders.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[52px] shrink-0 items-center rounded-full bg-primary px-[26px] text-[17px] font-semibold leading-none text-on-primary transition-colors hover:bg-primary-light"
            >
              {bulkOrders.cta}
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
