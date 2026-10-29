// Run with `npm test` (Node's built-in test runner; Node strips the TypeScript types).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seedMenu } from "./menu/seed-data.ts";
import type { Menu } from "./menu/types.ts";
import {
  bundledPrice,
  formatPence,
  fromPrice,
  isAvailableOn,
  londonWeekday,
  orderTotals,
  priceCart,
  unavailableLines,
  vatIncluded,
  type CartLineInput,
} from "./pricing.ts";

const line = (productSlug: string, extra: Partial<CartLineInput> = {}): CartLineInput => ({
  productSlug,
  qty: 1,
  optionSlugs: {},
  extras: {},
  ...extra,
});

const product = (slug: string) => {
  const p = seedMenu.categories.flatMap((c) => c.products).find((x) => x.slug === slug);
  assert.ok(p, `seed product ${slug} exists`);
  return p;
};

describe("menu prices match the printed menu", () => {
  const expected: Record<string, number> = {
    "ofada-box": 2600,
    "mini-pack": 1000,
    "regular-pack": 1500,
    "large-pack": 2600,
    "fried-turkey": 250,
    "fried-fish": 250,
    snail: 500,
    "boiled-egg": 100,
    moimoi: 300,
    "fried-plantain": 200,
    "extra-wrap": 300,
  };
  for (const [slug, pence] of Object.entries(expected)) {
    it(`${slug} = ${formatPence(pence)}`, () => assert.equal(product(slug).pricePence, pence));
  }

  it("sauce sizes are separate items: £17 / £20 / £39 / £95", () => {
    const cart = priceCart(
      ["classic-sauce", "sauce-1l", "sauce-2l", "sauce-5l"].map((slug) => line(slug)),
      seedMenu,
    );
    assert.equal(cart.issues.length, 0);
    assert.deepEqual(
      cart.lines.map((l) => l.totalPence),
      [1700, 2000, 3900, 9500],
    );
  });
});

describe("options", () => {
  it("Ofada Box protein choices don't change the price", () => {
    for (const proteins of ["turkey-beef", "2-turkey", "2-beef"]) {
      const cart = priceCart([line("ofada-box", { optionSlugs: { proteins } })], seedMenu);
      assert.equal(cart.subtotalPence, 2600);
      assert.equal(cart.issues.length, 0);
    }
  });

  it("rejects a missing required option", () => {
    const cart = priceCart([line("ofada-box")], seedMenu);
    assert.deepEqual(cart.issues.map((i) => i.code), ["missing_option"]);
    assert.equal(cart.subtotalPence, 0);
  });

  it("rejects an option that doesn't exist", () => {
    const cart = priceCart([line("ofada-box", { optionSlugs: { proteins: "3-goat" } })], seedMenu);
    assert.deepEqual(cart.issues.map((i) => i.code), ["invalid_option"]);
  });

  it("rejects an unknown option group", () => {
    const cart = priceCart(
      [line("ofada-box", { optionSlugs: { proteins: "2-beef", colour: "red" } })],
      seedMenu,
    );
    assert.deepEqual(cart.issues.map((i) => i.code), ["invalid_option"]);
  });

  it("'from' price is the cheapest required option", () => {
    const withSizes = { ...product("regular-pack"), optionGroups: [{ slug: "size", name: "Size", required: true, min: 1, max: 1,
      options: [{ slug: "s", name: "S", priceDeltaPence: 0 }, { slug: "l", name: "L", priceDeltaPence: 500 }] }] };
    assert.deepEqual(fromPrice(withSizes), { pence: 1500, isFrom: true });
    assert.deepEqual(fromPrice(product("ofada-box")), { pence: 2600, isFrom: false });
    assert.deepEqual(fromPrice(product("classic-sauce")), { pence: 1700, isFrom: false });
  });
});

describe("extras (protein add-ons)", () => {
  it("adds extras to the unit price and multiplies by quantity", () => {
    const cart = priceCart(
      [
        line("regular-pack", {
          qty: 2,
          extras: { "fried-turkey": 1, snail: 1 },
        }),
      ],
      seedMenu,
    );
    assert.equal(cart.lines[0].unitPence, 1500 + 250 + 500);
    assert.equal(cart.subtotalPence, (1500 + 250 + 500) * 2);
  });

  it("only products that accept extras can have them", () => {
    const cart = priceCart([line("fried-plantain", { extras: { "fried-turkey": 1 } })], seedMenu);
    assert.deepEqual(cart.issues.map((i) => i.code), ["extras_not_allowed"]);
  });

  it("rejects non-extra products used as extras", () => {
    const cart = priceCart([line("mini-pack", { extras: { "ofada-box": 1 } })], seedMenu);
    assert.deepEqual(cart.issues.map((i) => i.code), ["invalid_extra"]);
  });

  it("rejects fractional, negative or excessive extra quantities", () => {
    for (const n of [1.5, -1, 11]) {
      const cart = priceCart([line("mini-pack", { extras: { "fried-fish": n } })], seedMenu);
      assert.deepEqual(cart.issues.map((i) => i.code), ["invalid_extra"], `qty ${n}`);
    }
  });

  it("ignores extras set to zero", () => {
    const cart = priceCart([line("mini-pack", { extras: { "fried-fish": 0 } })], seedMenu);
    assert.equal(cart.issues.length, 0);
    assert.equal(cart.subtotalPence, 1000);
  });
});

describe("egg bundle: £1 each, 4 for £3.50", () => {
  const egg = product("boiled-egg");
  const cases: [number, number][] = [
    [1, 100],
    [3, 300],
    [4, 350],
    [5, 450],
    [8, 700],
    [9, 800],
  ];
  for (const [qty, pence] of cases) {
    it(`${qty} eggs = ${formatPence(pence)}`, () => assert.equal(bundledPrice(egg, qty), pence));
  }

  it("applies when bought on their own", () => {
    const cart = priceCart([line("boiled-egg", { qty: 4 })], seedMenu);
    assert.equal(cart.subtotalPence, 350);
  });

  it("applies to eggs added as extras, per item", () => {
    const cart = priceCart([line("large-pack", { qty: 2, extras: { "boiled-egg": 4 } })], seedMenu);
    assert.equal(cart.lines[0].unitPence, 2600 + 350);
    assert.equal(cart.subtotalPence, (2600 + 350) * 2);
  });
});

describe("cart validation", () => {
  it("rejects unknown products", () => {
    const cart = priceCart([line("pizza")], seedMenu);
    assert.deepEqual(cart.issues.map((i) => i.code), ["unknown_product"]);
  });

  it("rejects sold-out products", () => {
    const soldOutMenu: Menu = {
      categories: seedMenu.categories.map((c) => ({
        ...c,
        products: c.products.map((p) => (p.slug === "snail" ? { ...p, soldOut: true } : p)),
      })),
    };
    assert.deepEqual(priceCart([line("snail")], soldOutMenu).issues.map((i) => i.code), ["sold_out"]);
    assert.deepEqual(
      priceCart([line("mini-pack", { extras: { snail: 1 } })], soldOutMenu).issues.map((i) => i.code),
      ["invalid_extra"],
    );
  });

  it("rejects quantities outside 1–20", () => {
    for (const qty of [0, -1, 21, 2.5]) {
      const cart = priceCart([line("moimoi", { qty })], seedMenu);
      assert.deepEqual(cart.issues.map((i) => i.code), ["invalid_qty"], `qty ${qty}`);
    }
  });

  it("prices the good lines and reports the bad ones", () => {
    const cart = priceCart([line("fried-plantain", { qty: 2 }), line("pizza"), line("extra-wrap")], seedMenu);
    assert.equal(cart.subtotalPence, 2 * 200 + 300);
    assert.equal(cart.itemCount, 3);
    assert.deepEqual(cart.issues, [{ index: 1, code: "unknown_product", productSlug: "pizza" }]);
  });

  it("a full Ofada order adds up", () => {
    const cart = priceCart(
      [
        line("ofada-box", { optionSlugs: { proteins: "2-beef" }, extras: { "fried-turkey": 1, "boiled-egg": 4 }, qty: 2 }),
        line("sauce-1l"),
        line("fried-plantain", { qty: 3 }),
      ],
      seedMenu,
    );
    assert.equal(cart.subtotalPence, (2600 + 250 + 350) * 2 + 2000 + 3 * 200);
    assert.equal(cart.issues.length, 0);
  });
});

describe("Saturday-only items", () => {
  // 24 Oct 2026 is a Saturday.
  const saturday = new Date("2026-10-24T12:00:00Z");
  const friday = new Date("2026-10-23T12:00:00Z");

  it("knows the day of the week in Manchester", () => {
    assert.equal(londonWeekday(saturday), 6);
    assert.equal(londonWeekday(friday), 5);
    // 23:30 UTC on Friday 22 May is already 00:30 Saturday in London (BST).
    assert.equal(londonWeekday(new Date("2026-05-22T23:30:00Z")), 6);
  });

  it("MoiMoi only on Saturdays", () => {
    assert.equal(isAvailableOn(product("moimoi"), saturday), true);
    assert.equal(isAvailableOn(product("moimoi"), friday), false);
    assert.equal(isAvailableOn(product("ofada-box"), friday), true);
  });

  it("flags cart lines that can't be made on the chosen day", () => {
    const cart = priceCart([line("moimoi"), line("fried-plantain")], seedMenu);
    assert.deepEqual(
      unavailableLines(cart, friday).map((l) => l.product.slug),
      ["moimoi"],
    );
    assert.equal(unavailableLines(cart, saturday).length, 0);
  });
});

describe("totals & VAT", () => {
  it("prices are VAT-inclusive — never marked up", () => {
    assert.deepEqual(orderTotals(2600, 350, true), { totalPence: 2950, vatPence: vatIncluded(2950) });
    assert.equal(vatIncluded(2400), 400); // £24.00 incl. £4.00 VAT
  });

  it("no VAT figure when not VAT-registered", () => {
    assert.deepEqual(orderTotals(2600, 0, false), { totalPence: 2600, vatPence: null });
  });

  it("formats pounds", () => {
    assert.equal(formatPence(0), "£0.00");
    assert.equal(formatPence(350), "£3.50");
    assert.equal(formatPence(9500), "£95.00");
  });
});
