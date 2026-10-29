// Copy for the menu and item pages. Menu items themselves live in the database
// (seeded from lib/menu/seed-data.ts).

export const menuPage = {
  eyebrow: "OUR MENU",
  title: "AUTHENTIC. FRESH. DELICIOUS.",
  preorderNote: (notice: string) => `PRE-ORDER ONLY · ORDER AT LEAST ${notice.toUpperCase()} AHEAD`,
  banner: {
    src: "/images/menu-banner-moimoi-plate.jpg",
    alt: "Ofada rice with moimoi and classic sauce with assorted meat and a boiled egg, on a black plate",
  },
  // Short pill labels for the sticky filter (falls back to the category name).
  filterLabels: {
    "ofada-box": "OFADA BOX",
    "ofada-meals": "MEALS",
    sauce: "SAUCE",
    "protein-add-ons": "ADD-ONS",
    sides: "SIDES",
    "bulk-orders": "BULK",
  } as Record<string, string>,
};

/**
 * Products shown as an auto-playing photo carousel (every 3 s) instead of one photo.
 * Keyed by product slug; other products keep their single image from the menu.
 */
export const productGalleries: Record<string, { src: string; alt: string }[]> = {
  "ofada-box": [
    { src: "/images/story-box-closed.jpg", alt: "The Ofada Box, closed: no forks, no knives, just hands" },
    { src: "/images/product-ofada-box.jpg", alt: "The Ofada Box, open: Ofada rice, classic sauce with egg, peppered protein and fried plantain" },
  ],
};

/** Bulk / party orders — handled on WhatsApp, shown at the end of the menu page. */
export const bulkOrders = {
  slug: "bulk-orders",
  title: "BULK ORDERS",
  body: "Feeding a crowd? Parties, owambes, church and office events — we wrap Ofada rice by the dozen and cook the sauce in bulk. Message us on WhatsApp with your date and numbers and we'll put a quote together.",
  images: [
    { src: "/images/bulk1.jpg", alt: "Dozens of Ofada rice portions wrapped in leaves for a bulk order" },
    { src: "/images/bulk2.jpg", alt: "Rows of leaf-wrapped Ofada rice topped with sauce and boiled eggs for an event" },
  ],
  cta: "ORDER IN BULK ON WHATSAPP",
  whatsappMessage: "Hi Ofada Manchester! I'd like to place a bulk order. Date: … Number of people: … Pickup or delivery: …",
};

/** Small labels on menu cards. */
export const cardLabels = {
  outOfStock: "OUT OF STOCK",
  saturdaysOnly: "Saturdays only",
};

export const itemPage = {
  back: "Back to menu",
  addToCart: "ADD TO CART",
  added: "ADDED ✓",
  soldOut: "OUT OF STOCK",
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
