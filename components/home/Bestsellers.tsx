import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { productGalleries } from "@/content/menu";
import { bestsellers } from "@/content/home";
import { getMenu } from "@/lib/menu/get-menu";
import { formatPence, fromPrice } from "@/lib/pricing";
import { ArrowIcon } from "./ArrowIcon";

export async function Bestsellers() {
  const menu = await getMenu();
  const all = menu.categories.flatMap((c) => c.products);
  const items = bestsellers.productSlugs
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p) => p !== undefined);

  return (
    <section className="flex flex-col gap-7 bg-bg px-8 pb-20">
      <div className="flex flex-wrap items-center justify-between">
        <h2 className="w-full font-wordmark text-[32px] leading-8 tracking-[-0.96px] text-ink tablet:w-auto">
          {bestsellers.title}
        </h2>
        <Link
          href={bestsellers.cta.href}
          className="group inline-flex h-[52px] items-center gap-2.5 rounded-full border-2 border-primary pl-[26px] pr-5 text-[17px] font-semibold leading-none text-ink transition-colors hover:bg-primary hover:text-on-primary"
        >
          <span>{bestsellers.cta.label}</span>
          <span className="text-primary transition-[color,transform] group-hover:translate-x-1 group-hover:text-on-primary">
            <ArrowIcon />
          </span>
        </Link>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        {items.map((p) => {
          const price = fromPrice(p);
          return (
            <ProductCard
              key={p.slug}
              href={`/menu/${p.slug}`}
              name={p.name}
              price={`${price.isFrom ? "From " : ""}${formatPence(price.pence)}`}
              image={p.image}
              gallery={productGalleries[p.slug]}
              badge={p.badge}
              soldOut={p.soldOut}
            />
          );
        })}
      </div>
    </section>
  );
}
