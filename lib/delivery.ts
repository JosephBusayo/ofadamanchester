// Delivery fee by distance from the kitchen. Pure helpers — the postcode → lat/lng
// lookup (postcodes.io) happens server-side in phase 5.

export type LatLng = { lat: number; lng: number };
export type DeliveryTier = { maxKm: number; feePence: number };

/** Straight-line distance doesn't follow roads; scale it to approximate driving distance. */
export const ROAD_FACTOR = 1.3;

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function roadDistanceKm(kitchen: LatLng, customer: LatLng): number {
  return Math.round(haversineKm(kitchen, customer) * ROAD_FACTOR * 100) / 100;
}

export type DeliveryQuote =
  | { ok: true; distanceKm: number; feePence: number }
  | { ok: false; distanceKm: number; reason: "too_far" | "below_minimum"; minimumPence?: number };

/**
 * Picks the first tier whose `maxKm` covers the distance. Beyond `maxDeliveryKm` (or
 * past the last tier) we don't deliver. Optionally enforces a minimum order for delivery.
 */
export function quoteDelivery(args: {
  distanceKm: number;
  tiers: DeliveryTier[];
  maxDeliveryKm: number;
  subtotalPence?: number;
  minOrderPence?: number;
}): DeliveryQuote {
  const { distanceKm, maxDeliveryKm, subtotalPence = 0, minOrderPence = 0 } = args;
  if (distanceKm > maxDeliveryKm) return { ok: false, distanceKm, reason: "too_far" };
  const tier = [...args.tiers].sort((a, b) => a.maxKm - b.maxKm).find((t) => distanceKm <= t.maxKm);
  if (!tier) return { ok: false, distanceKm, reason: "too_far" };
  if (subtotalPence < minOrderPence) {
    return { ok: false, distanceKm, reason: "below_minimum", minimumPence: minOrderPence };
  }
  return { ok: true, distanceKm, feePence: tier.feePence };
}

// UK postcode, e.g. "M1 1AE", "M14 5RG", "OL1 3EQ". Case/space-insensitive.
const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?) ?(\d[A-Z]{2})$/;

/** Normalises to "AA9 9AA" form, or returns null if it isn't a valid UK postcode. */
export function normalisePostcode(input: string): string | null {
  const m = input.trim().toUpperCase().replace(/\s+/g, " ").match(UK_POSTCODE);
  return m ? `${m[1]} ${m[2]}` : null;
}
