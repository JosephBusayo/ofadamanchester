import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { seedMenu } from "./seed-data";
import type { Menu, MenuProduct } from "./types";

export const MENU_CACHE_TAG = "menu";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * The active menu, grouped by category. Reads Supabase when it's configured;
 * otherwise (local dev before Supabase is set up) falls back to the seed data.
 * Cached; the admin area will call revalidateTag(MENU_CACHE_TAG) after edits.
 */
export async function getMenu(): Promise<Menu> {
  "use cache";
  cacheTag(MENU_CACHE_TAG);
  cacheLife("minutes");

  if (!supabaseUrl || !supabaseAnonKey) return seedMenu;

  const db = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("categories")
    .select(
      `slug, name, sort,
       products (slug, name, description, price_pence, image_url, badge, allergens, available_days,
         sold_out, is_extra, accepts_extras, bundle_qty, bundle_price_pence, sort, is_active,
         option_groups (slug, name, required, min_select, max_select, sort,
           options (slug, name, price_delta_pence, sort)))`,
    )
    .order("sort");
  if (error) throw new Error(`Failed to load menu: ${error.message}`);

  const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;
  return {
    categories: data.map((c) => ({
      slug: c.slug,
      name: c.name,
      products: c.products
        .filter((p) => p.is_active)
        .sort(bySort)
        .map(
          (p): MenuProduct => ({
            slug: p.slug,
            categorySlug: c.slug,
            name: p.name,
            description: p.description,
            pricePence: p.price_pence,
            image: p.image_url,
            badge: p.badge,
            allergens: p.allergens,
            availableDays: p.available_days,
            soldOut: p.sold_out,
            isExtra: p.is_extra,
            acceptsExtras: p.accepts_extras,
            bundle:
              p.bundle_qty && p.bundle_price_pence !== null
                ? { qty: p.bundle_qty, pricePence: p.bundle_price_pence }
                : null,
            optionGroups: p.option_groups.sort(bySort).map((g) => ({
              slug: g.slug,
              name: g.name,
              required: g.required,
              min: g.min_select,
              max: g.max_select,
              options: g.options.sort(bySort).map((o) => ({
                slug: o.slug,
                name: o.name,
                priceDeltaPence: o.price_delta_pence,
              })),
            })),
          }),
        ),
    })),
  };
}

export async function getProduct(slug: string) {
  const menu = await getMenu();
  for (const category of menu.categories) {
    const product = category.products.find((p) => p.slug === slug);
    if (product) return { product, category, menu };
  }
  return null;
}

/** Products that can be added to a meal as extras (protein add-ons). */
export function getExtras(menu: Menu): MenuProduct[] {
  return menu.categories.flatMap((c) => c.products).filter((p) => p.isExtra && !p.soldOut);
}
