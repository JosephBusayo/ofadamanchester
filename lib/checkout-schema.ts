import { z } from "zod";
import { normalisePostcode } from "./delivery";
import { MAX_EXTRA_QTY, MAX_LINE_QTY } from "./pricing";

/** UK mobile → "+447…" (accepts 07…, 447…, +44 7…, with spaces/dashes). null if invalid. */
export function normaliseUkMobile(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const m = digits.match(/^(?:\+44|0044|44|0)(7\d{9})$/);
  return m ? `+44${m[1]}` : null;
}

const slug = z.string().regex(/^[a-z0-9-]{1,60}$/);

const cartLine = z.object({
  productSlug: slug,
  qty: z.number().int().min(1).max(MAX_LINE_QTY),
  optionSlugs: z.record(slug, slug).default({}),
  extras: z.record(slug, z.number().int().min(0).max(MAX_EXTRA_QTY)).default({}),
});

export const cartSchema = z.array(cartLine).min(1, "Your cart is empty.").max(30);

const text = (max: number) => z.string().trim().max(max);

export const checkoutSchema = z
  .object({
    lines: cartSchema,
    fulfilment: z.enum(["pickup", "delivery"]),
    slot: z.iso.datetime({ message: "Choose a time." }),
    name: text(80).min(2, "Enter your name."),
    email: z.email({ message: "Enter a valid email." }).max(120),
    phone: z.string().transform((v, ctx) => {
      const phone = normaliseUkMobile(v);
      if (!phone) ctx.addIssue({ code: "custom", message: "Enter a UK mobile number (07…)." });
      return phone ?? "";
    }),
    address1: text(120).optional().default(""),
    address2: text(120).optional().default(""),
    city: text(60).optional().default(""),
    postcode: z.string().optional().default(""),
    notes: text(300).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.fulfilment !== "delivery") return;
    if (v.address1.length < 3) ctx.addIssue({ code: "custom", path: ["address1"], message: "Enter your street address." });
    if (v.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter your town or city." });
    if (!normalisePostcode(v.postcode)) ctx.addIssue({ code: "custom", path: ["postcode"], message: "Enter a valid UK postcode." });
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type FieldErrors = Partial<Record<keyof CheckoutInput, string>>;
