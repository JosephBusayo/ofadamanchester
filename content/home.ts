// Home page copy. Marked TODO(client) where the owner should supply/approve wording.
// Prices here are display-only; checkout always re-prices from the database.

export const hero = {
  words: ["WRAPPED.", "SAUCED.", "SERVED."] as const,
  accentWord: 2, // 1-based index of the highlighted word
  // TODO(client): approve subtitle
  subtitle: "Ofada rice wrapped in leaf, our classic sauce and a boiled egg. A taste of home, delivered fresh.",
  primary: { label: "ORDER NOW", href: "/menu" },
  secondary: { label: "VIEW MENU", href: "/menu" },
  image: {
    src: "/placeholders/hero.svg",
    alt: "The Ofada Box: Ofada rice wrapped in leaf, classic sauce, boiled egg, proteins and fried plantain",
    width: 2400,
    height: 902,
  },
  stickers: {
    one: "#1",
    new: "NEW",
    hot: "HOT",
  },
  ticker: ["OFADA BOX", "OFADA RICE", "CLASSIC SAUCE", "FRIED PLANTAIN", "MOIMOI"],
};

export const manifesto = {
  marquee: ["OFADA RICE", "CLASSIC SAUCE", "FRIED PLANTAIN"],
  // TODO(client): owner's own words
  quote:
    "“We kept it simple: Ofada rice wrapped in leaf, our classic sauce, a boiled egg and proteins done right. No gimmicks, no shortcuts — just the taste of home we’d want to eat every single day.”",
  // Order: left-top, right-top, left-bottom, right-bottom
  badges: [
    { label: "OFADA", tone: "primary" },
    { label: "SAUCED", tone: "accent" },
    { label: "PLANTAIN", tone: "accent" },
    { label: "WRAPPED", tone: "ink" },
  ] as const,
  cta: { label: "READ OUR STORY", href: "/our-story" },
};

export const receipt = {
  title: "MADE TO BE *SHARED*",
  photos: [
    { src: "/placeholders/polaroid-1.svg", caption: "first bite, best bite", alt: "Ofada rice and sauce being shared" },
    { src: "/placeholders/polaroid-2.svg", caption: "sunday with the family", alt: "Family sharing Ofada boxes at the table" },
    { src: "/placeholders/polaroid-3.svg", caption: "extra sauce pls", alt: "Close-up of the classic Ofada sauce" },
  ],
  hint: "click for more ↻",
  storeName: "OFADA",
  storeAddress: "MANCHESTER · UK",
  tableLine: "PACK 07 · WRAPPED IN LEAF",
  lines: [
    { qty: "1x", label: "GOOD FOOD", mark: "✓" },
    { qty: "1x", label: "BOLD FLAVOURS", mark: "✓" },
    { qty: "1x", label: "PEOPLE YOU LOVE", mark: "✓" },
    { qty: "0x", label: "SHORTCUTS", mark: "—" },
  ],
  totalLabel: "TOTAL",
  totalValue: "A TASTE OF HOME",
  footer: "THANK YOU · COME HUNGRY",
  stamp: "PAID",
  // TODO(client): approve body copy
  body: "At Ofada Manchester, we believe great food brings people together. Ofada rice wrapped in leaf, our classic sauce, proper portions and a whole lot of love.",
  cta: { label: "OUR STORY", href: "/our-story" },
  reprintLabel: "PRINT AGAIN",
};

export const bestsellers = {
  title: "OUR BESTSELLERS",
  cta: { label: "VIEW FULL MENU", href: "/menu" },
  // Product slugs from the menu — names, prices, images and badges come from the menu data.
  productSlugs: ["ofada-box", "regular-pack", "large-pack", "classic-sauce"],
};

export const storyMenuCards = [
  { title: "OUR STORY", href: "/our-story", image: "/placeholders/card-our-story.svg", alt: "The Ofada Manchester kitchen" },
  { title: "MENU", href: "/menu", image: "/placeholders/card-menu.svg", alt: "Ofada rice with classic sauce and plantain" },
];
