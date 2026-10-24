// Our Story copy. TODO(client): every paragraph here is placeholder wording in the
// shop's voice — the owner should rewrite it with the real story (who, when, why).
import type { ManifestoContent } from "@/components/home/Manifesto";

export const storyBanner = {
  title: "OUR STORY",
  image: { src: "/placeholders/story-banner.svg", alt: "Ofada rice wrapped in leaf, ready to serve" },
};

export const storyManifesto: ManifestoContent = {
  quote:
    "“We started Ofada Manchester with one simple idea — cook the food we grew up on, the way it’s meant to be made, and share it with Manchester.\n\nWhat matters most is the rice, the sauce and the care — not shortcuts.”",
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
    title: "A TASTE\nOF HOME\nIN MANCHESTER",
    paragraphs: [
      "Ofada Manchester began in a home kitchen, cooking Ofada rice and sauce for friends and family who missed the taste of home. Word spread, the orders grew, and the idea stayed the same: a short menu, done properly, made fresh.",
    ],
    layout: "a",
    images: [{ src: "/placeholders/story-1.svg", alt: "Ofada rice wrapped in leaf" }],
  },
  {
    title: "THE MENU",
    paragraphs: [
      "Every pack starts with Ofada rice, wrapped in leaf the traditional way, and our classic sauce — slow-cooked with peppers and assorted, rich and properly spicy. Every meal comes with a boiled egg.",
      "On the side: fried plantain, extra proteins and MoiMoi on Saturdays. A few things, made well — everything you need, nothing you don’t.",
      "Want it at home? Take the sauce home by the litre.",
    ],
    layout: "b",
    images: [
      { src: "/placeholders/story-2a.svg", alt: "Fried plantain" },
      { src: "/placeholders/story-2b.svg", alt: "The Ofada Box" },
    ],
  },
  {
    title: "THE SAUCE",
    paragraphs: [
      "Our classic Ofada sauce is the heart of everything we cook. It takes time, patience and a lot of peppers — and it’s exactly how we were taught to make it.",
    ],
    layout: "c",
    images: [{ src: "/placeholders/story-3.svg", alt: "Classic Ofada sauce" }],
  },
  {
    title: "THE KITCHEN",
    paragraphs: [
      "We cook every order fresh in Manchester, for pickup or delivery. Good food comes from people who care about it — and you can taste it in every wrap.",
    ],
    layout: "d",
    images: [{ src: "/placeholders/story-4.svg", alt: "Cooking in the Ofada kitchen" }],
  },
];
