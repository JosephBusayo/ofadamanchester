// Menu shapes shared by the server data layer, pages and pricing.
// Money is always integer pence.

export type MenuOption = {
  slug: string;
  name: string;
  priceDeltaPence: number;
};

export type MenuOptionGroup = {
  slug: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: MenuOption[];
};

export type MenuProduct = {
  slug: string;
  categorySlug: string;
  name: string;
  description: string;
  pricePence: number;
  image: string | null;
  badge: string | null;
  /** UK allergen keys (see allergens.ts); null = not yet confirmed by the kitchen. */
  allergens: string[] | null;
  /** 0 = Sunday … 6 = Saturday; null = every day. */
  availableDays: number[] | null;
  soldOut: boolean;
  isExtra: boolean;
  acceptsExtras: boolean;
  bundle: { qty: number; pricePence: number } | null;
  optionGroups: MenuOptionGroup[];
};

export type MenuCategory = {
  slug: string;
  name: string;
  products: MenuProduct[];
};

export type Menu = {
  categories: MenuCategory[];
};
