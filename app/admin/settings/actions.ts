"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { MENU_CACHE_TAG } from "@/lib/menu/get-menu";
import { notifyNewOrder, type ChannelResult } from "@/lib/notifications/notify";
import { sampleOrder } from "@/lib/notifications/sample-order";
import { checkRateLimit } from "@/lib/rate-limit";
import { SETTINGS_CACHE_TAG } from "@/lib/settings";

export type SaveResult = { ok: boolean; message: string };

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour).");
const period = z
  .object({ open: time, close: time })
  .refine((p) => p.open < p.close, { message: "Closing time must be after opening time." });
const day = z.array(period).max(3);

const settingsSchema = z.object({
  ordersPaused: z.boolean(),
  openingHours: z.object({ "0": day, "1": day, "2": day, "3": day, "4": day, "5": day, "6": day }),
  leadTimeMinutes: z.number().int().min(0).max(240),
  deliveryTiers: z
    .array(z.object({ maxKm: z.number().min(0.5).max(50), feePence: z.number().int().min(0).max(5000) }))
    .min(1, "Add at least one delivery band.")
    .max(6),
  maxDeliveryKm: z.number().min(0.5).max(50),
  minOrderDeliveryPence: z.number().int().min(0).max(20000),
  pickupAddress: z.string().trim().min(3, "Enter the pickup address.").max(200),
});

export type SettingsInput = z.input<typeof settingsSchema>;

export async function saveSettingsAction(input: SettingsInput): Promise<SaveResult> {
  const { db } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const s = parsed.data;

  const tiers = [...s.deliveryTiers].sort((a, b) => a.maxKm - b.maxKm);
  const { error } = await db
    .from("settings")
    .update({
      orders_paused: s.ordersPaused,
      opening_hours: s.openingHours,
      lead_time_minutes: s.leadTimeMinutes,
      delivery_tiers: tiers.map((t) => ({ max_km: t.maxKm, fee_pence: t.feePence })),
      max_delivery_km: s.maxDeliveryKm,
      min_order_delivery_pence: s.minOrderDeliveryPence,
      pickup_address: s.pickupAddress,
    })
    .eq("id", true);
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };

  updateTag(SETTINGS_CACHE_TAG);
  return { ok: true, message: "Saved. The shop is using the new settings now." };
}

export async function setOrdersPausedAction(paused: boolean): Promise<SaveResult> {
  const { db } = await requireAdmin();
  const { error } = await db.from("settings").update({ orders_paused: paused === true }).eq("id", true);
  if (error) return { ok: false, message: `Couldn't update: ${error.message}` };
  updateTag(SETTINGS_CACHE_TAG);
  return { ok: true, message: paused ? "Online orders paused." : "Online orders are open." };
}

/**
 * Sends a sample order through the real email + WhatsApp setup so the owner can check
 * alerts work without a real payment. The "customer" email goes to the signed-in admin.
 */
export async function sendTestNotificationsAction(): Promise<{ results: ChannelResult[] } | { error: string }> {
  const { email } = await requireAdmin();
  if (!(await checkRateLimit("quote"))) return { error: "Too many tests — wait a few minutes." };
  const stamp = String(Date.now());
  const order = {
    ...sampleOrder,
    id: crypto.randomUUID(),
    number: 9999,
    customerName: "Test Order",
    email,
    notes: "TEST — this is a test notification from the admin settings page. No real order was placed.",
  };
  const results = await notifyNewOrder(order, { idempotencySuffix: stamp });
  return { results };
}

const productToggle = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,60}$/),
  field: z.enum(["sold_out", "is_active"]),
  value: z.boolean(),
});

export async function setProductFlagAction(slug: string, field: "sold_out" | "is_active", value: boolean): Promise<SaveResult> {
  const { db } = await requireAdmin();
  const parsed = productToggle.safeParse({ slug, field, value });
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { data, error } = await db
    .from("products")
    .update({ [parsed.data.field]: parsed.data.value })
    .eq("slug", parsed.data.slug)
    .select("name")
    .maybeSingle();
  if (error || !data) return { ok: false, message: `Couldn't update: ${error?.message ?? "not found"}` };
  updateTag(MENU_CACHE_TAG);
  return { ok: true, message: "Updated." };
}
