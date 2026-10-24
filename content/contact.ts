// Contact page copy. Address and opening hours come from the shop settings (admin).
import { site } from "./site";

export const contactPage = {
  eyebrow: "CONTACT",
  title: "COME HUNGRY. LEAVE HAPPY.",
  intro: "Order online, message us on WhatsApp or drop us a line. Feeding a crowd? Tell us and we'll sort the trays.",
  cards: {
    visit: "PICKUP FROM",
    hours: "OPENING HOURS",
    hello: "SAY HELLO",
  },
  image: { src: "/placeholders/contact-banner.svg", alt: "Ofada rice and sauce ready for pickup" },
  // TODO(client): confirm they take party / catering orders
  cta: {
    kicker: "PARTY ORDERS",
    title: "FEEDING A CROWD?",
    body: "Birthdays, owambes, office lunches — order trays of Ofada rice and sauce by the litre and we'll have it ready.",
    label: "MESSAGE US ON WHATSAPP",
    href: `${site.whatsapp.href}?text=${encodeURIComponent("Hi Ofada! I'd like to ask about a party order.")}`,
  },
};
