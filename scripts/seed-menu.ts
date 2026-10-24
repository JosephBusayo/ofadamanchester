// Upserts the menu from lib/menu/seed-data.ts into Supabase. Safe to re-run:
// rows are matched by slug, so prices/descriptions are updated in place.
//
//   npm run db:seed        (reads .env.local)
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "@supabase/supabase-js";
import { seedMenu } from "../lib/menu/seed-data.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function upsert(table: string, rows: Record<string, unknown>[], onConflict: string) {
  const { data, error } = await db.from(table).upsert(rows, { onConflict }).select("id, slug");
  if (error) throw new Error(`${table}: ${error.message}`);
  return new Map((data ?? []).map((r: { id: string; slug: string }) => [r.slug, r.id]));
}

const categoryIds = await upsert(
  "categories",
  seedMenu.categories.map((c, i) => ({ slug: c.slug, name: c.name, sort: i })),
  "slug",
);

let productCount = 0;
for (const category of seedMenu.categories) {
  const productIds = await upsert(
    "products",
    category.products.map((p, i) => ({
      category_id: categoryIds.get(category.slug),
      slug: p.slug,
      name: p.name,
      description: p.description,
      price_pence: p.pricePence,
      image_url: p.image,
      badge: p.badge,
      allergens: p.allergens,
      available_days: p.availableDays,
      sold_out: p.soldOut,
      is_extra: p.isExtra,
      accepts_extras: p.acceptsExtras,
      bundle_qty: p.bundle?.qty ?? null,
      bundle_price_pence: p.bundle?.pricePence ?? null,
      sort: i,
    })),
    "slug",
  );
  productCount += productIds.size;

  for (const p of category.products) {
    for (const [gi, group] of p.optionGroups.entries()) {
      const { data: g, error } = await db
        .from("option_groups")
        .upsert(
          {
            product_id: productIds.get(p.slug),
            slug: group.slug,
            name: group.name,
            required: group.required,
            min_select: group.min,
            max_select: group.max,
            sort: gi,
          },
          { onConflict: "product_id,slug" },
        )
        .select("id")
        .single();
      if (error) throw new Error(`option_groups: ${error.message}`);
      const { error: optError } = await db.from("options").upsert(
        group.options.map((o, oi) => ({
          group_id: g.id,
          slug: o.slug,
          name: o.name,
          price_delta_pence: o.priceDeltaPence,
          sort: oi,
        })),
        { onConflict: "group_id,slug" },
      );
      if (optError) throw new Error(`options: ${optError.message}`);
    }
  }
}

console.log(`Seeded ${categoryIds.size} categories and ${productCount} products.`);
