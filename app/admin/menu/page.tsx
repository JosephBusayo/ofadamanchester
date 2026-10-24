import { Suspense } from "react";
import styles from "@/components/admin/Admin.module.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductToggles } from "@/components/admin/ProductToggles";
import { requireAdmin } from "@/lib/admin/auth";
import { formatPence } from "@/lib/pricing";

export const metadata = { title: "Menu" };

export default function AdminMenuPage() {
  return (
    <AdminShell>
      <h1 className={styles.title}>MENU</h1>
      <p className={styles.subtitle}>
        Mark items sold out for the day, or hide them. Changes show on the shop straight away. Prices and new items are
        changed in <code>lib/menu/seed-data.ts</code> then <code>npm run db:seed</code>.
      </p>
      <Suspense fallback={<p>Loading menu…</p>}>
        <MenuList />
      </Suspense>
    </AdminShell>
  );
}

type Category = {
  slug: string;
  name: string;
  products: { slug: string; name: string; price_pence: number; sold_out: boolean; is_active: boolean; sort: number }[];
};

async function MenuList() {
  const { db } = await requireAdmin();
  // As the admin, RLS returns hidden items too.
  const { data, error } = await db
    .from("categories")
    .select("slug, name, products (slug, name, price_pence, sold_out, is_active, sort)")
    .order("sort");
  if (error) return <p className={styles.error}>Couldn&apos;t load the menu: {error.message}</p>;

  return (
    <div className={styles.stack}>
      {(data as Category[]).map((c) => (
        <section key={c.slug} className={styles.card}>
          <h2 className={styles.cardTitle}>{c.name}</h2>
          {[...c.products]
            .sort((a, b) => a.sort - b.sort)
            .map((p) => (
              <ProductToggles
                key={p.slug}
                slug={p.slug}
                name={`${p.name} · ${formatPence(p.price_pence)}`}
                soldOut={p.sold_out}
                active={p.is_active}
              />
            ))}
        </section>
      ))}
    </div>
  );
}
