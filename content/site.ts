// Site-wide copy and contact details. Placeholders marked TODO are waiting on the client.

export const site = {
  name: "Ofada Manchester",
  wordmark: "OFADA",
  tagline: "A Taste of Home, Delivered Fresh",
  description:
    "Authentic Ofada rice wrapped in leaf with our classic sauce. Order online for pickup or delivery in Manchester.",
  whatsapp: {
    display: "+44 7932 541874",
    href: "https://wa.me/447932541874",
  },
  /** Where customers outside our delivery areas are sent to arrange delivery. */
  deliveryWhatsapp: {
    display: "+44 7532 716848",
    href: "https://wa.me/447532716848",
  },
  instagram: {
    handle: "@ofadamanchester",
    href: "https://www.instagram.com/ofadamanchester/",
  },
  // TODO(client): kitchen / pickup address and contact email
  address: ["MANCHESTER", "UNITED KINGDOM"],
  email: "hello@ofadamanchester.co.uk",
  // TODO(client): the legal trading name (sole trader name or Ltd company + number) for the legal pages.
  legalName: "Ofada Manchester",
  legalUpdated: "23 October 2026",
} as const;

export const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Allergens", href: "/allergens" },
] as const;

export const mainNav = [
  { label: "HOME", href: "/" },
  { label: "MENU", href: "/menu" },
  { label: "OUR STORY", href: "/our-story" },
  { label: "CONTACT", href: "/contact" },
] as const;

export const orderCta = { label: "ORDER NOW", href: "/menu" } as const;

export const footer = {
  quickLinks: {
    title: "QUICK LINKS",
    links: [
      { label: "HOME", href: "/" },
      { label: "MENU", href: "/menu" },
      { label: "OUR STORY", href: "/our-story" },
      { label: "ALLERGENS", href: "/allergens" },
      { label: "CONTACT", href: "/contact" },
    ],
  },
  social: {
    title: "SOCIAL",
    links: [
      { label: "INSTAGRAM", href: site.instagram.href },
      { label: "WHATSAPP", href: site.whatsapp.href },
    ],
  },
} as const;
