// Delivery fee: only postcode districts on the owner's list are delivered to. Each one
// has a fixed price or a price worked out from distance (base fee + per extra km),
// plus optional evening / rain surcharges. Pure helpers — lookups happen server-side.

export type LatLng = { lat: number; lng: number };

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

/**
 * How the fee is worked out: a base fee (also the minimum) covers the first `baseKm`, then
 * `perKmPence` per extra km. Deliveries further than `farKm` get `farDiscountPercent` off.
 */
export type DeliveryPricing = {
  basePence: number;
  baseKm: number;
  perKmPence: number;
  farKm: number;
  farDiscountPercent: number;
};

/** A postcode district we deliver to, e.g. "M14". `feePence` set = fixed price; null = calculated from distance. */
export type DeliveryArea = { district: string; feePence: number | null };

export type DeliverySurcharges = {
  /** Added when the delivery time is at or after `nightFrom` (Manchester time). 0 = off. */
  nightPence: number;
  nightFrom: string; // "HH:MM"
  /** Added when rain is forecast at the delivery time. 0 = off. */
  rainPence: number;
};

export type FeeLine = { label: string; pence: number };

export type DeliveryQuote =
  | { ok: true; distanceKm: number; feePence: number; breakdown: FeeLine[] }
  | { ok: false; reason: "not_covered" | "below_minimum" | "paused"; minimumPence?: number };

/** Prices are rounded up to the next 50p so they look like real prices (£4.50, not £4.37). */
export const ROUND_TO_PENCE = 50;

/** The automatic distance-based price. */
export function distanceFeePence(distanceKm: number, pricing: Pick<DeliveryPricing, "basePence" | "baseKm" | "perKmPence">): number {
  const extraKm = Math.max(0, distanceKm - pricing.baseKm);
  const raw = pricing.basePence + extraKm * pricing.perKmPence;
  return Math.max(pricing.basePence, Math.ceil(raw / ROUND_TO_PENCE) * ROUND_TO_PENCE);
}

/**
 * Discount for far-away deliveries (further than `farKm`). Never takes the fee below the
 * base fee, which is the minimum delivery price. Rounded to the nearest 5p.
 */
export function farDiscountPence(feePence: number, distanceKm: number, pricing: DeliveryPricing): number {
  if (pricing.farDiscountPercent <= 0 || distanceKm <= pricing.farKm) return 0;
  const discount = Math.round((feePence * pricing.farDiscountPercent) / 100 / 5) * 5;
  return Math.max(0, Math.min(discount, feePence - pricing.basePence));
}

/** "M14 5RG" → "M14". Expects a normalised postcode. */
export function postcodeDistrict(postcode: string): string {
  return postcode.trim().toUpperCase().split(" ")[0];
}

/** "m14" / " M14 " → "M14"; null if it isn't a UK postcode district. */
export function normaliseDistrict(input: string): string | null {
  const d = input.trim().toUpperCase();
  return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(d) ? d : null;
}

/** Is `hhmm` (Manchester wall-clock time of the delivery) in the night window? Night runs from `nightFrom` until 06:00. */
export function isNight(hhmm: string, nightFrom: string): boolean {
  return hhmm >= nightFrom || hhmm < "06:00";
}

/**
 * Delivery price for a customer postcode. Only districts on the list are delivered to;
 * everything else is "not_covered" (the site sends them to WhatsApp instead).
 */
export function quoteDelivery(args: {
  postcode: string;
  distanceKm: number;
  areas: DeliveryArea[];
  pricing: DeliveryPricing;
  surcharges: DeliverySurcharges;
  /** Manchester time of the delivery slot, "HH:MM". */
  slotTime: string;
  raining: boolean;
  deliveryPaused?: boolean;
  subtotalPence?: number;
  minOrderPence?: number;
}): DeliveryQuote {
  const { distanceKm, surcharges, subtotalPence = 0, minOrderPence = 0 } = args;
  if (args.deliveryPaused) return { ok: false, reason: "paused" };

  const district = postcodeDistrict(args.postcode);
  const area = args.areas.find((a) => a.district === district);
  if (!area) return { ok: false, reason: "not_covered" };
  if (subtotalPence < minOrderPence) return { ok: false, reason: "below_minimum", minimumPence: minOrderPence };

  const deliveryPence = area.feePence ?? distanceFeePence(distanceKm, args.pricing);
  const breakdown: FeeLine[] = [{ label: "Delivery", pence: deliveryPence }];
  const discount = farDiscountPence(deliveryPence, distanceKm, args.pricing);
  if (discount > 0) {
    breakdown.push({ label: `Long-distance discount (${args.pricing.farDiscountPercent}%)`, pence: -discount });
  }
  if (surcharges.nightPence > 0 && isNight(args.slotTime, surcharges.nightFrom)) {
    breakdown.push({ label: "Evening delivery", pence: surcharges.nightPence });
  }
  if (surcharges.rainPence > 0 && args.raining) {
    breakdown.push({ label: "Rainy weather", pence: surcharges.rainPence });
  }
  const feePence = breakdown.reduce((sum, l) => sum + l.pence, 0);
  return { ok: true, distanceKm, feePence, breakdown };
}

// UK postcode, e.g. "M1 1AE", "M14 5RG", "OL1 3EQ". Case/space-insensitive.
const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?) ?(\d[A-Z]{2})$/;

/** Normalises to "AA9 9AA" form, or returns null if it isn't a valid UK postcode. */
export function normalisePostcode(input: string): string | null {
  const m = input.trim().toUpperCase().replace(/\s+/g, " ").match(UK_POSTCODE);
  return m ? `${m[1]} ${m[2]}` : null;
}
