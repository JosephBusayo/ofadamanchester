// Our Story copy, in the founder's own words (from Bolade's story video captions).
import type { ManifestoContent } from "@/components/home/Manifesto";

export const storyBanner = {
  title: "OUR STORY",
  image: {
    src: "/images/story-banner-founder.jpg",
    alt: "Bolade, founder of Ofada Manchester, in denim dungarees and a cream Ofada top, holding a stack of Ofada bowls",
  },
};

export const storyManifesto: ManifestoContent = {
  quote:
    "“I didn’t start as a chef. I started as a girl who missed the flavours of home.\n\nOfada Manchester is not just a food brand, but a bridge between home and here.”",
  badges: [
    { label: "OFADA", tone: "primary" },
    { label: "SAUCED", tone: "accent" },
    { label: "PLANTAIN", tone: "accent" },
    { label: "WRAPPED", tone: "ink" },
  ],
};

export type StoryChapter = {
  title: string; // "\n" = line break
  paragraphs: string[];
  /** a: small photo right · b: tall + square pair · c: small photo left · d: wide photo */
  layout: "a" | "b" | "c" | "d";
  images: { src: string; alt: string }[];
};

export const storyChapters: StoryChapter[] = [
  {
    title: "HI, I’M\nBOLADE",
    paragraphs: [
      "I’m the founder of Ofada Manchester — this is more than just a business, it’s my story.",
      "When I moved to the UK, I deeply missed the taste of home. I couldn’t find authentic Ofada sauce the way we enjoy it back in Nigeria: rich, smoky and deeply flavoured.",
    ],
    layout: "a",
    images: [{ src: "/images/story-rice-wrap.jpg", alt: "Ofada rice wrapped in leaf" }],
  },
  {
    title: "THE DAY\nEVERYTHING\nCHANGED",
    paragraphs: [
      "One day, I cooked it for my sister-in-law’s baby’s first birthday, and everything changed.",
      "I wasn’t prepared for what happened next. Everyone who tasted it lit up. Some asked for more, others quietly wiped their plates clean.",
      "They all said the same thing: “This tastes like home.”",
    ],
    layout: "b",
    images: [
      { src: "/images/story-founder.jpg", alt: "Bolade, founder of Ofada Manchester, holding a stack of Ofada bowls" },
      { src: "/images/story-box-closed.jpg", alt: "An Ofada Box: no forks, no knives, just hands" },
    ],
  },
  {
    title: "WHY NOT\nSHARE IT?",
    paragraphs: [
      "That moment sparked something in me. If one meal could take people back home, even just for a moment, why not share that with others?",
      "So I decided to share that feeling with others, and that’s how Ofada Manchester was born.",
    ],
    layout: "c",
    images: [{ src: "/images/story-sauce-tray.jpg", alt: "Classic Ofada sauce with assorted meat and a boiled egg" }],
  },
  {
    title: "THE OFADA GIRL",
    paragraphs: [
      "Today, I’m building something beautiful from that craving: delivering real Nigerian meals to those who miss them the most.",
      "So yes, I’m the Ofada Girl, serving you a taste of home, delivered freshly, right here in Manchester.",
    ],
    layout: "d",
    images: [{ src: "/images/story-plantain.jpg", alt: "Fried plantain" }],
  },
];
