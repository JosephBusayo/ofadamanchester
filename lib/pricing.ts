// Pricing engine shared by the UI (display) and the server (authoritative totals at
// checkout). Pure functions, integer pence everywhere. No runtime imports so it can be
// unit-tested with plain `node --test`.

import type { Menu, MenuProduct } from "./menu/types";

export const MAX_LINE_QTY = 20;
export const MAX_EXTRA_QTY = 10;

/** Price for `qty` of a product on its own, applying any bundle deal (e.g. 4 eggs for £3.50). */
export function bundledPrice(product: Pick<MenuProduct, "pricePence" | "bundle">, qty: number): number {
  if (!product.bundle) return product.pricePence * qty;
  const bundles = Math.floor(qty / product.bundle.qty);
  const rest = qty % product.bundle.qty;
  return bundles * product.bundle.pricePence + rest * product.pricePence;
}

export type LineSelection = {
  optionSlugs: Record<string, string>; // option group slug → option slug
  extras: Record<string, number>; // extra product slug → qty per item
  qty: number;
};

/**
 * Unit price (one item incl. options + extras) and line total. Extras are priced per
 * item, so the egg deal applies to the eggs on each item (4 eggs on a box = £3.50).
 * Assumes a valid selection — use priceCart() to validate untrusted input.
 */
export function priceLine(
  product: MenuProduct,
  selection: LineSelection,
  extrasCatalog: MenuProduct[],
): { unitPence: number; totalPence: number } {
  let unit = product.pricePence;
  for (const group of product.optionGroups) {
    const chosen = group.options.find((o) => o.slug === selection.optionSlugs[group.slug]);
    if (chosen) unit += chosen.priceDeltaPence;
  }
  for (const [slug, qty] of Object.entries(selection.extras)) {
    const extra = extrasCatalog.find((e) => e.slug === slug);
    if (extra && qty > 0) unit += bundledPrice(extra, qty);
  }
  // A standalone bundle item (e.g. 4 eggs) gets the deal across the whole quantity.
  const total = product.bundle ? bundledPrice(product, selection.qty) : unit * selection.qty;
  return { unitPence: unit, totalPence: total };
}

/** Lowest possible price, for "from £x" labels on products with priced options. */
export function fromPrice(product: MenuProduct): { pence: number; isFrom: boolean } {
  let min = product.pricePence;
  let isFrom = false;
  for (const group of product.optionGroups) {
    const deltas = group.options.map((o) => o.priceDeltaPence);
    if (new Set(deltas).size > 1) isFrom = true;
    if (group.required && deltas.length) min += Math.min(...deltas);
  }
  return { pence: min, isFrom };
}

// ───────────────────────── Cart ─────────────────────────

export type CartLineInput = {
  productSlug: string;
  qty: number;
  optionSlugs: Record<string, string>;
  extras: Record<string, number>;
};

export type PricedLine = {
  index: number;
  product: MenuProduct;
  qty: number;
  options: { group: string; name: string; priceDeltaPence: number }[];
  extras: { slug: string; name: string; qty: number; pricePence: number }[];
  unitPence: number;
  totalPence: number;
};

export type CartIssueCode =
  | "unknown_product"
  | "sold_out"
  | "invalid_qty"
  | "missing_option"
  | "invalid_option"
  | "extras_not_allowed"
  | "invalid_extra";

export type CartIssue = { index: number; code: CartIssueCode; productSlug: string };

export type PricedCart = {
  lines: PricedLine[];
  issues: CartIssue[];
  subtotalPence: number;
  itemCount: number;
};

const isWholeNumber = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);

/**
 * Validates and prices a cart against the menu. Lines with any problem are left out
 * of the total and reported in `issues` — never trust client-side prices.
 */
export function priceCart(input: CartLineInput[], menu: Menu): PricedCart {
  const products = new Map(menu.categories.flatMap((c) => c.products).map((p) => [p.slug, p]));
  const extrasCatalog = [...products.values()].filter((p) => p.isExtra);
  const lines: PricedLine[] = [];
  const issues: CartIssue[] = [];

  input.forEach((line, index) => {
    const fail = (code: CartIssueCode) => issues.push({ index, code, productSlug: line.productSlug });
    const product = products.get(line.productSlug);
    if (!product) return fail("unknown_product");
    if (product.soldOut) return fail("sold_out");
    if (!isWholeNumber(line.qty) || line.qty < 1 || line.qty > MAX_LINE_QTY) return fail("invalid_qty");

    const options: PricedLine["options"] = [];
    for (const group of product.optionGroups) {
      const slug = line.optionSlugs?.[group.slug];
      if (slug === undefined) {
        if (group.required) return fail("missing_option");
        continue;
      }
      const option = group.options.find((o) => o.slug === slug);
      if (!option) return fail("invalid_option");
      options.push({ group: group.name, name: option.name, priceDeltaPence: option.priceDeltaPence });
    }
    const knownGroups = new Set(product.optionGroups.map((g) => g.slug));
    if (Object.keys(line.optionSlugs ?? {}).some((g) => !knownGroups.has(g))) return fail("invalid_option");

    const extras: PricedLine["extras"] = [];
    const chosenExtras = Object.entries(line.extras ?? {}).filter(([, n]) => n !== 0);
    if (chosenExtras.length && !product.acceptsExtras) return fail("extras_not_allowed");
    for (const [slug, qty] of chosenExtras) {
      const extra = extrasCatalog.find((e) => e.slug === slug);
      if (!extra || extra.soldOut || !isWholeNumber(qty) || qty < 1 || qty > MAX_EXTRA_QTY) {
        return fail("invalid_extra");
      }
      extras.push({ slug, name: extra.name, qty, pricePence: bundledPrice(extra, qty) });
    }

    const { unitPence, totalPence } = priceLine(
      product,
      { optionSlugs: line.optionSlugs ?? {}, extras: Object.fromEntries(chosenExtras), qty: line.qty },
      extrasCatalog,
    );
    lines.push({ index, product, qty: line.qty, options, extras, unitPence, totalPence });
  });

  return {
    lines,
    issues,
    subtotalPence: lines.reduce((sum, l) => sum + l.totalPence, 0),
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
  };
}

// ───────────────────────── Availability ─────────────────────────

const LONDON_WEEKDAY = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short" });
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Day of week (0 = Sunday) in Manchester, regardless of the server's timezone. */
export function londonWeekday(date: Date): number {
  return WEEKDAYS.indexOf(LONDON_WEEKDAY.format(date));
}

/** Whether a product can be ordered for collection/delivery on `date` (e.g. MoiMoi = Saturdays). */
export function isAvailableOn(product: Pick<MenuProduct, "availableDays">, date: Date): boolean {
  return !product.availableDays || product.availableDays.includes(londonWeekday(date));
}

/** Cart lines that can't be fulfilled on `date`. */
export function unavailableLines(cart: PricedCart, date: Date): PricedLine[] {
  return cart.lines.filter((l) => !isAvailableOn(l.product, date));
}

// ───────────────────────── Totals ─────────────────────────

/** VAT contained in a VAT-inclusive price at 20% (= total ÷ 6). Prices are never marked up. */
export function vatIncluded(totalPence: number): number {
  return Math.round(totalPence / 6);
}

export function orderTotals(
  subtotalPence: number,
  deliveryFeePence: number,
  vatRegistered: boolean,
): { totalPence: number; vatPence: number | null } {
  const totalPence = subtotalPence + deliveryFeePence;
  return { totalPence, vatPence: vatRegistered ? vatIncluded(totalPence) : null };
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
