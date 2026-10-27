// Copy for the menu and item pages. Menu items themselves live in the database
// (seeded from lib/menu/seed-data.ts).

export const menuPage = {
  eyebrow: "OUR MENU",
  title: "AUTHENTIC. FRESH. DELICIOUS.",
  banner: {
    src: "/images/menu-banner-ofada-sauce.jpg",
    alt: "Classic Ofada sauce with assorted meat",
  },
  // Short pill labels for the sticky filter (falls back to the category name).
  filterLabels: {
    "ofada-box": "OFADA BOX",
    "ofada-meals": "MEALS",
    sauce: "SAUCE",
    "protein-add-ons": "ADD-ONS",
    sides: "SIDES",
  } as Record<string, string>,
};

export const itemPage = {
  back: "Back to menu",
  addToCart: "ADD TO CART",
  added: "ADDED ✓",
  soldOut: "SOLD OUT",
  quantity: "Quantity",
  extrasTitle: "ADD EXTRAS",
  extrasSubtitle: "Add proteins to your meal",
  containsPrefix: "Contains:",
  allergensTitle: "ALLERGENS",
  allergensSubtitle: "The 14 UK allergens",
  allergensContains: "Contains",
  allergensFree: "—",
  // Shown until the kitchen confirms allergens for the dish.
  allergensPending:
    "Allergen information for this dish is being confirmed. If you have an allergy, please message us on WhatsApp before ordering.",
  allergensNote: "Made in a kitchen that handles all 14 allergens; cross-contamination is possible.",
  saturdayOnly: "Available on Saturdays only — choose a Saturday collection or delivery at checkout.",
  alsoLike: "YOU MAY ALSO LIKE",
};
