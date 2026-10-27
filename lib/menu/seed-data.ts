// The Ofada menu exactly as printed (design/reference/ofada-menu.jpg).
// Used to seed Supabase (`npm run db:seed`) and as the local fallback when
// Supabase isn't configured. Relative imports only — the seed script runs in plain Node.
//
// TODO(client): allergens are null (unconfirmed) for every item until the kitchen
// confirms them. Eggs are listed only where an egg is part of the dish.

import type { Menu, MenuProduct } from "./types.ts";

const SATURDAY = 6;

function product(p: Partial<MenuProduct> & Pick<MenuProduct, "slug" | "categorySlug" | "name" | "pricePence">): MenuProduct {
  return {
    description: "",
    image: null,
    badge: null,
    allergens: null,
    availableDays: null,
    soldOut: false,
    isExtra: false,
    acceptsExtras: false,
    bundle: null,
    optionGroups: [],
    ...p,
  };
}

export const seedMenu: Menu = {
  categories: [
    {
      slug: "ofada-box",
      name: "THE OFADA BOX",
      products: [
        product({
          slug: "ofada-box",
          categorySlug: "ofada-box",
          name: "The Ofada Box",
          pricePence: 2600,
          badge: "#1",
          image: "/images/product-ofada-box-cutout.webp",
          description:
            "2 wraps of Ofada rice in leaf, our classic sauce, 1 boiled egg, 2 proteins and 6–8 pieces of fried plantain.",
          acceptsExtras: true,
          optionGroups: [
            {
              slug: "proteins",
              name: "Choose your proteins",
              required: true,
              min: 1,
              max: 1,
              options: [
                { slug: "turkey-beef", name: "1 Turkey + 1 Beef", priceDeltaPence: 0 },
                { slug: "2-turkey", name: "2 Turkey", priceDeltaPence: 0 },
                { slug: "2-beef", name: "2 Beef", priceDeltaPence: 0 },
              ],
            },
          ],
        }),
      ],
    },
    {
      slug: "ofada-meals",
      name: "OFADA MEALS",
      products: [
        product({
          slug: "mini-pack",
          categorySlug: "ofada-meals",
          name: "Ofadà Mini Pack",
          pricePence: 1000,
          image: "/images/product-mini-pack.jpg",
          description: "1 wrap of Ofada rice in leaf, classic sauce and 1 boiled egg.",
          acceptsExtras: true,
        }),
        product({
          slug: "regular-pack",
          categorySlug: "ofada-meals",
          name: "Ofadà Regular Pack",
          pricePence: 1500,
          image: "/images/product-regular-pack.jpg",
          description: "2 wraps of Ofada rice in leaf, classic sauce and 1 boiled egg.",
          acceptsExtras: true,
        }),
        product({
          slug: "large-pack",
          categorySlug: "ofada-meals",
          name: "Ofadà Large Pack",
          pricePence: 2600,
          image: "/images/product-large-pack.jpg",
          description: "4 wraps of Ofada rice in leaf, a large portion of classic sauce and 2 boiled eggs.",
          acceptsExtras: true,
        }),
      ],
    },
    {
      slug: "sauce",
      name: "TAKE THE SAUCE HOME",
      products: [
        product({
          slug: "classic-sauce",
          categorySlug: "sauce",
          name: "Classic Ofada Sauce",
          pricePence: 1700,
          badge: "HOT",
          image: "/images/product-sauce.jpg",
          description: "Our classic Ofada sauce with diced assorted. Rice and extra protein not included.",
          optionGroups: [
            {
              slug: "size",
              name: "Choose a size",
              required: true,
              min: 1,
              max: 1,
              options: [
                { slug: "750ml", name: "750ml", priceDeltaPence: 0 },
                { slug: "1l", name: "1 Litre", priceDeltaPence: 300 },
                { slug: "2l", name: "2 Litres", priceDeltaPence: 2200 },
                { slug: "5l", name: "5 Litres", priceDeltaPence: 7800 },
              ],
            },
          ],
        }),
      ],
    },
    {
      slug: "protein-add-ons",
      name: "PROTEIN ADD-ONS",
      products: [
        product({
          slug: "fried-turkey",
          categorySlug: "protein-add-ons",
          name: "Fried Turkey",
          pricePence: 250,
          image: "/images/product-fried-turkey.jpg",
          isExtra: true,
        }),
        product({
          slug: "fried-fish",
          categorySlug: "protein-add-ons",
          name: "Fried Fish",
          pricePence: 250,
          image: "/images/product-fried-fish.jpg",
          isExtra: true,
        }),
        product({
          slug: "snail",
          categorySlug: "protein-add-ons",
          name: "Snail",
          pricePence: 500,
          image: "/images/product-snail.jpg",
          isExtra: true,
        }),
        product({
          slug: "boiled-egg",
          categorySlug: "protein-add-ons",
          name: "Extra Boiled Egg",
          pricePence: 100,
          image: "/images/product-boiled-egg.jpg",
          description: "£1 each, or 4 for £3.50.",
          isExtra: true,
          bundle: { qty: 4, pricePence: 350 },
          badge: "4 FOR £3.50",
        }),
      ],
    },
    {
      slug: "sides",
      name: "SIDES",
      products: [
        product({
          slug: "moimoi",
          categorySlug: "sides",
          name: "MoiMoi",
          pricePence: 300,
          image: "/images/product-moimoi.jpg",
          badge: "SAT ONLY",
          description: "Steamed bean pudding. Available on Saturdays only.",
          availableDays: [SATURDAY],
        }),
        product({
          slug: "fried-plantain",
          categorySlug: "sides",
          name: "Fried Plantain",
          pricePence: 200,
          image: "/images/product-fried-plantain.jpg",
          description: "6–8 pieces of sweet fried plantain.",
        }),
        product({
          slug: "extra-wrap",
          categorySlug: "sides",
          name: "Extra Wrap of Ofada Rice",
          pricePence: 300,
          image: "/images/product-extra-wrap.jpg",
          description: "One more wrap of Ofada rice in leaf.",
        }),
      ],
    },
  ],
};
