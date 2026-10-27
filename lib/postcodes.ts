import "server-only";

import { cacheLife } from "next/cache";
import { findPostcode, type LatLng } from "./delivery";

// KITCHEN_POSTCODE (Vercel env) = the kitchen, e.g. "M7 2BA". Fallback only for local dev.
const FALLBACK_KITCHEN_POSTCODE = "M1 1AE"; // Manchester city centre

/** Postcode → lat/lng via postcodes.io (free, no key). null if the postcode doesn't exist. */
export async function lookupPostcode(postcode: string): Promise<LatLng | null> {
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`postcodes.io responded ${res.status}`);
  const body = (await res.json()) as { result?: { latitude: number | null; longitude: number | null } };
  const { latitude, longitude } = body.result ?? {};
  return latitude == null || longitude == null ? null : { lat: latitude, lng: longitude };
}

/** Postcode district (e.g. "M14") → its centre, via postcodes.io. null if unknown. */
export async function lookupDistrict(district: string): Promise<LatLng | null> {
  "use cache";
  cacheLife("days");
  const res = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(district)}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`postcodes.io responded ${res.status}`);
  const body = (await res.json()) as { result?: { latitude: number | null; longitude: number | null } };
  const { latitude, longitude } = body.result ?? {};
  return latitude == null || longitude == null ? null : { lat: latitude, lng: longitude };
}

export async function getKitchenLocation(): Promise<LatLng> {
  "use cache";
  cacheLife("days");
  // Tolerates extra words, e.g. "M72BA Salford Manchester" → "M7 2BA".
  const raw = process.env.KITCHEN_POSTCODE || FALLBACK_KITCHEN_POSTCODE;
  const postcode = findPostcode(raw) ?? raw;
  const location = await lookupPostcode(postcode);
  if (!location) throw new Error(`KITCHEN_POSTCODE "${postcode}" wasn't found`);
  return location;
}
