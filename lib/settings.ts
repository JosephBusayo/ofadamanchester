import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { DeliveryTier } from "./delivery";
import type { OpeningHours, ScheduleSettings } from "./schedule";

export const SETTINGS_CACHE_TAG = "settings";

export type ShopSettings = ScheduleSettings & {
  ordersPaused: boolean;
  deliveryTiers: DeliveryTier[];
  maxDeliveryKm: number;
  minOrderDeliveryPence: number;
  pickupAddress: string;
};

// TODO(client): placeholders until the owner confirms hours, fees and the pickup address.
// Once Supabase is connected these come from the `settings` row (editable in /admin).
const DEFAULT_HOURS: OpeningHours = {
  "0": [{ open: "12:00", close: "20:00" }],
  "1": [{ open: "12:00", close: "20:00" }],
  "2": [{ open: "12:00", close: "20:00" }],
  "3": [{ open: "12:00", close: "20:00" }],
  "4": [{ open: "12:00", close: "20:00" }],
  "5": [{ open: "12:00", close: "20:00" }],
  "6": [{ open: "12:00", close: "20:00" }],
};

export const DEFAULT_SETTINGS: ShopSettings = {
  ordersPaused: false,
  openingHours: DEFAULT_HOURS,
  leadTimeMinutes: 45,
  slotMinutes: 30,
  daysAhead: 7,
  deliveryTiers: [
    { maxKm: 3, feePence: 350 },
    { maxKm: 6, feePence: 500 },
    { maxKm: 10, feePence: 750 },
  ],
  maxDeliveryKm: 10,
  minOrderDeliveryPence: 0,
  pickupAddress: "Manchester (address confirmed in your email)",
};

/** Shop settings from Supabase, or the defaults above when Supabase isn't configured. */
export async function getSettings(): Promise<ShopSettings> {
  "use cache";
  cacheTag(SETTINGS_CACHE_TAG);
  cacheLife("minutes");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return DEFAULT_SETTINGS;

  const db = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await db.from("settings").select("*").single();
  if (error || !data) throw new Error(`Failed to load settings: ${error?.message ?? "no row"}`);

  const hours = data.opening_hours as OpeningHours;
  const tiers = (data.delivery_tiers as { max_km: number; fee_pence: number }[]) ?? [];
  return {
    ...DEFAULT_SETTINGS,
    ordersPaused: data.orders_paused,
    openingHours: Object.keys(hours ?? {}).length ? hours : DEFAULT_HOURS,
    leadTimeMinutes: data.lead_time_minutes,
    deliveryTiers: tiers.length
      ? tiers.map((t) => ({ maxKm: Number(t.max_km), feePence: t.fee_pence }))
      : DEFAULT_SETTINGS.deliveryTiers,
    maxDeliveryKm: Number(data.max_delivery_km),
    minOrderDeliveryPence: data.min_order_delivery_pence,
    pickupAddress: data.pickup_address || DEFAULT_SETTINGS.pickupAddress,
  };
}

/** The settings the browser needs (no secrets). */
export function publicSettings(s: ShopSettings) {
  return {
    ordersPaused: s.ordersPaused,
    openingHours: s.openingHours,
    leadTimeMinutes: s.leadTimeMinutes,
    slotMinutes: s.slotMinutes,
    daysAhead: s.daysAhead,
    pickupAddress: s.pickupAddress,
    vatRegistered: process.env.VAT_REGISTERED === "true",
  };
}
export type PublicSettings = ReturnType<typeof publicSettings>;
