import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { DeliveryArea, DeliveryPricing, DeliverySurcharges } from "./delivery";
import type { OpeningHours, ScheduleSettings } from "./schedule";

export const SETTINGS_CACHE_TAG = "settings";

export type ShopSettings = ScheduleSettings & {
  ordersPaused: boolean;
  /** Postcode districts we deliver to. Anything else is sent to WhatsApp. */
  deliveryAreas: DeliveryArea[];
  deliveryPricing: DeliveryPricing;
  deliverySurcharges: DeliverySurcharges;
  /** Switch off delivery only (e.g. bad weather) — pickup still works. */
  deliveryPaused: boolean;
  deliveryPausedMessage: string;
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

/** Central Manchester + nearby Salford districts (M10 doesn't exist). Same list as the 0002 migration. */
export const STARTER_DISTRICTS = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M11", "M12", "M13", "M14", "M15", "M16", "M18", "M19", "M20", "M21", "M22", "M23", "M25", "M27", "M30", "M50"];
export const DEFAULT_DELIVERY_PAUSED_MESSAGE = "We're not delivering right now — pickup is still open.";

export const DEFAULT_SETTINGS: ShopSettings = {
  ordersPaused: false,
  openingHours: DEFAULT_HOURS,
  leadTimeMinutes: 24 * 60, // pre-order only: at least 24 hours' notice
  slotMinutes: 30,
  daysAhead: 8, // today + 7 — with 24h notice that still leaves a week of days to choose
  // TODO(client): starter list — the owner edits it in /admin/settings.
  deliveryAreas: STARTER_DISTRICTS.map((district) => ({ district, feePence: null })),
  deliveryPricing: { basePence: 450, baseKm: 3, perKmPence: 100, farKm: 8, farDiscountPercent: 5 },
  deliverySurcharges: { nightPence: 100, nightFrom: "19:00", rainPence: 100 },
  deliveryPaused: false,
  deliveryPausedMessage: DEFAULT_DELIVERY_PAUSED_MESSAGE,
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
  return {
    ...DEFAULT_SETTINGS,
    ordersPaused: data.orders_paused,
    openingHours: Object.keys(hours ?? {}).length ? hours : DEFAULT_HOURS,
    leadTimeMinutes: data.lead_time_minutes,
    ...deliveryFromRow(data),
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
    deliveryPaused: s.deliveryPaused,
    deliveryPausedMessage: s.deliveryPausedMessage,
    vatRegistered: process.env.VAT_REGISTERED === "true",
  };
}
export type PublicSettings = ReturnType<typeof publicSettings>;

/** Settings row → delivery settings. Shared by the shop and the admin form. */
export function deliveryFromRow(row: Record<string, unknown>) {
  const areas = (row.delivery_areas as { district: string; fee_pence: number | null }[] | null) ?? [];
  return {
    deliveryAreas: areas.map((a) => ({ district: a.district, feePence: a.fee_pence ?? null })),
    deliveryPricing: {
      basePence: Number(row.delivery_base_pence ?? 450),
      baseKm: Number(row.delivery_base_km ?? 3),
      perKmPence: Number(row.delivery_per_km_pence ?? 100),
      farKm: Number(row.delivery_far_km ?? 8),
      farDiscountPercent: Number(row.delivery_far_discount_percent ?? 0),
    },
    deliverySurcharges: {
      nightPence: Number(row.night_surcharge_pence ?? 0),
      nightFrom: String(row.night_from ?? "19:00"),
      rainPence: Number(row.rain_surcharge_pence ?? 0),
    },
    deliveryPaused: Boolean(row.delivery_paused),
    deliveryPausedMessage: String(row.delivery_paused_message || DEFAULT_DELIVERY_PAUSED_MESSAGE),
  };
}
