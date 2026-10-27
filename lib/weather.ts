import "server-only";

import { cacheLife } from "next/cache";
import type { LatLng } from "./delivery";
import { londonParts } from "./schedule";

/** Forecast rain (mm in the hour) at or above this counts as "raining" — light drizzle doesn't. */
export const RAIN_MM_PER_HOUR = 0.5;

type Forecast = { time: string[]; precipitation: number[] };

// Open-Meteo: free, no API key. Hourly forecast in Manchester time, up to 8 days ahead.
async function hourlyForecast(lat: number, lng: number): Promise<Forecast | null> {
  "use cache";
  cacheLife("minutes");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    "&hourly=precipitation&timezone=Europe%2FLondon&forecast_days=8";
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const body = (await res.json()) as { hourly?: Forecast };
  return body.hourly ?? null;
}

/**
 * Is rain forecast near `location` at `when`? Never blocks an order: if the forecast
 * can't be fetched, it answers false (no surcharge).
 */
export async function isRainForecast(location: LatLng, when: Date): Promise<boolean> {
  try {
    const forecast = await hourlyForecast(location.lat, location.lng);
    if (!forecast) return false;
    const p = londonParts(when);
    const pad = (n: number) => String(n).padStart(2, "0");
    const key = `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:00`;
    const i = forecast.time.indexOf(key);
    return i >= 0 && (forecast.precipitation[i] ?? 0) >= RAIN_MM_PER_HOUR;
  } catch (err) {
    console.warn("Weather check failed — no rain surcharge applied", err instanceof Error ? err.message : err);
    return false;
  }
}
