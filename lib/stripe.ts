import "server-only";

import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-only Stripe client, or null when STRIPE_SECRET_KEY isn't set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key, { appInfo: { name: "Ofada Manchester" } });
  return client;
}

export function isTestMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
}
