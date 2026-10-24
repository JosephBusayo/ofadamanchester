import { Suspense } from "react";
import styles from "@/components/admin/Admin.module.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/admin/auth";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { OpeningHours } from "@/lib/schedule";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AdminShell>
      <h1 className={styles.title}>SETTINGS</h1>
      <Suspense fallback={<p>Loading settings…</p>}>
        <Settings />
      </Suspense>
    </AdminShell>
  );
}

async function Settings() {
  const { db } = await requireAdmin();
  // Read fresh (not the shop's cached copy) so the form always shows what's saved.
  const { data, error } = await db.from("settings").select("*").single();
  if (error || !data) return <p className={styles.error}>Couldn&apos;t load settings: {error?.message}</p>;

  const hours = (data.opening_hours ?? {}) as OpeningHours;
  const hasHours = Object.keys(hours).length > 0;
  const tiers = (data.delivery_tiers ?? []) as { max_km: number; fee_pence: number }[];
  const openingHours = Object.fromEntries(
    ["0", "1", "2", "3", "4", "5", "6"].map((d) => [
      d,
      (hasHours ? hours : DEFAULT_SETTINGS.openingHours)[d as keyof OpeningHours] ?? [],
    ]),
  ) as Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", { open: string; close: string }[]>;

  return (
    <SettingsForm
      initial={{
        ordersPaused: data.orders_paused,
        openingHours,
        leadTimeMinutes: data.lead_time_minutes,
        deliveryTiers: tiers.length
          ? tiers.map((t) => ({ maxKm: Number(t.max_km), feePence: t.fee_pence }))
          : DEFAULT_SETTINGS.deliveryTiers,
        maxDeliveryKm: Number(data.max_delivery_km),
        minOrderDeliveryPence: data.min_order_delivery_pence,
        pickupAddress: data.pickup_address || "",
      }}
    />
  );
}
