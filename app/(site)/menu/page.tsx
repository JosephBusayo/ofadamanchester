import type { Metadata } from "next";
import Image from "next/image";
import { MenuFilter } from "@/components/menu/MenuFilter";
import { ProductCard } from "@/components/ProductCard";
import { menuPage } from "@/content/menu";
import { MENU_SCROLL_OFFSET } from "@/lib/menu/constants";
import { getMenu } from "@/lib/menu/get-menu";
import { formatPence, fromPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Menu",
  description: "The Ofada Box, Ofada meal packs, our classic sauce to take home, protein add-ons and sides.",
};

export default async function MenuPage() {
  const menu = await getMenu();
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
      </section>

      <div className="mt-10 px-8">
        <div className="relative h-80 overflow-hidden rounded-2xl">
          <Image
            src={menuPage.banner.src}
            alt={menuPage.banner.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized={menuPage.banner.src.endsWith(".svg")}
          />
        </div>
      </div>

      <div className="pointer-events-none sticky top-20 z-10 mt-10">
        <MenuFilter
          items={categories.map((c) => ({ slug: c.slug, label: menuPage.filterLabels[c.slug] ?? c.name }))}
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
                    badge={p.badge}
                    soldOut={p.soldOut}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
