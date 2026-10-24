import "server-only";

import { cacheLife } from "next/cache";
import type { LatLng } from "./delivery";

// TODO(client): set KITCHEN_POSTCODE to the real kitchen postcode.
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

export async function getKitchenLocation(): Promise<LatLng> {
  "use cache";
  cacheLife("days");
  const postcode = process.env.KITCHEN_POSTCODE || FALLBACK_KITCHEN_POSTCODE;
  const location = await lookupPostcode(postcode);
  if (!location) throw new Error(`KITCHEN_POSTCODE "${postcode}" wasn't found`);
  return location;
}
