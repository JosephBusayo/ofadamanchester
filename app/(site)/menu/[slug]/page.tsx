import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import styles from "@/components/menu/ItemDetail.module.css";
import { OrderPanel } from "@/components/menu/OrderPanel";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ProductCard } from "@/components/ProductCard";
import { availabilityNote } from "@/lib/menu/availability";
import { itemPage, menuPage, productGalleries } from "@/content/menu";
import { UK_ALLERGENS, allergenNames } from "@/lib/menu/allergens";
import { getExtras, getMenu, getProduct } from "@/lib/menu/get-menu";
import { formatPence, fromPrice } from "@/lib/pricing";

const FALLBACK_IMAGE = "/placeholders/product.svg";

export async function generateStaticParams() {
  const menu = await getMenu();
  return menu.categories.flatMap((c) => c.products.map((p) => ({ slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await getProduct(slug);
  if (!found) return {};
  return { title: found.product.name, description: found.product.description };
}

// Reading `params` inside Suspense keeps client navigations between items instant
// (the shell shows while the item streams in). Known slugs are still prerendered.
export default function ItemPage(props: PageProps<"/menu/[slug]">) {
  return (
    <Suspense fallback={<div className={styles.wrap} style={{ minHeight: "100vh" }} aria-busy="true" />}>
      <Item {...props} />
    </Suspense>
  );
}

async function Item({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params;
  const found = await getProduct(slug);
  if (!found) notFound();
  const { product, category, menu } = found;

  const price = fromPrice(product);
  const image = product.image ?? FALLBACK_IMAGE;
  const gallery = productGalleries[product.slug];
  const saturdayOnly = product.availableDays?.length === 1 && product.availableDays[0] === 6;
  const related = category.products.filter((p) => p.slug !== product.slug);
  const alsoLike = (related.length ? related : menu.categories.flatMap((c) => c.products))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.top}>
          <nav className={styles.cats} aria-label="Menu categories">
            {menu.categories.map((c) => (
              <Link
                key={c.slug}
                href={`/menu#${c.slug}`}
                className={`${styles.pill} ${c.slug === category.slug ? styles.active : ""}`}
              >
                {menuPage.filterLabels[c.slug] ?? c.name}
              </Link>
            ))}
          </nav>
          <Link href={`/menu#${category.slug}`} className={styles.back}>
            <b aria-hidden>←</b>
            {itemPage.back}
          </Link>
        </div>

        <div className={styles.band}>
          <div className={styles.bandImage}>
            {gallery && gallery.length > 1 ? (
              <ImageCarousel images={gallery} sizes="(min-width: 700px) 560px, 80vw" fit="contain" priority interactive />
            ) : (
              <Image
                src={image}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 700px) 560px, 80vw"
                unoptimized={image.endsWith(".svg")}
              />
            )}
          </div>
        </div>

        <section className={styles.main}>
          {product.badge && <span className={styles.badge}>{product.badge}</span>}
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.meta}>
            <span className={styles.price}>
              {price.isFrom ? "From " : ""}
              {formatPence(price.pence)}
            </span>
          </div>
          {product.description && <p className={styles.desc}>{product.description}</p>}
          {product.allergens ? (
            <p className={styles.contains}>
              <strong>
                {itemPage.containsPrefix}{" "}
                {product.allergens.length ? allergenNames(product.allergens).join(", ") : "No major allergens"}
              </strong>
            </p>
          ) : (
            <p className={styles.notice}>{itemPage.allergensPending}</p>
          )}
          {saturdayOnly && <p className={styles.notice}>{itemPage.saturdayOnly}</p>}
          <OrderPanel product={product} extras={getExtras(menu)} />
        </section>

        {product.allergens && (
          <section className={styles.info} aria-labelledby="allergens-title">
            <h2 id="allergens-title">{itemPage.allergensTitle}</h2>
            <p className={styles.infoSub}>{itemPage.allergensSubtitle}</p>
            {Object.entries(UK_ALLERGENS).map(([key, name]) => {
              const present = product.allergens!.includes(key);
              return (
                <div key={key} className={`${styles.row} ${present ? styles.present : ""}`}>
                  <span>{name}</span>
                  <span>{present ? itemPage.allergensContains : itemPage.allergensFree}</span>
                </div>
              );
            })}
            <p className={styles.note}>{itemPage.allergensNote}</p>
          </section>
        )}
      </div>

      {alsoLike.length > 0 && (
        <section className="flex flex-col gap-7 bg-bg px-8 pb-24 pt-6">
          <h2 className="font-wordmark text-[32px] leading-8 tracking-[-0.96px] text-ink">{itemPage.alsoLike}</h2>
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {alsoLike.map((p) => {
              const pp = fromPrice(p);
              return (
                <ProductCard
                  key={p.slug}
                  href={`/menu/${p.slug}`}
                  name={p.name}
                  price={`${pp.isFrom ? "From " : ""}${formatPence(pp.pence)}`}
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
      )}
    </>
  );
}
