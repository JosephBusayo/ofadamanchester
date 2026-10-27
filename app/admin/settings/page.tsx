import { Suspense } from "react";
import styles from "@/components/admin/Admin.module.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { TestNotifications } from "@/components/admin/TestNotifications";
import { requireAdmin } from "@/lib/admin/auth";
import { distanceFeePence, roadDistanceKm } from "@/lib/delivery";
import { getKitchenLocation, lookupDistrict } from "@/lib/postcodes";
import { DEFAULT_SETTINGS, deliveryFromRow } from "@/lib/settings";
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
  const delivery = deliveryFromRow(data);
  const openingHours = Object.fromEntries(
    ["0", "1", "2", "3", "4", "5", "6"].map((d) => [
      d,
      (hasHours ? hours : DEFAULT_SETTINGS.openingHours)[d as keyof OpeningHours] ?? [],
    ]),
  ) as Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", { open: string; close: string }[]>;

  return (
    <div className={styles.stack}>
      <TestNotifications />
      <SettingsForm
      autoPrices={await autoPrices(delivery.deliveryAreas.map((a) => a.district), delivery.deliveryPricing)}
      initial={{
        ordersPaused: data.orders_paused,
        openingHours,
        leadTimeMinutes: data.lead_time_minutes,
        ...delivery,
        minOrderDeliveryPence: data.min_order_delivery_pence,
        pickupAddress: data.pickup_address || "",
      }}
      />
    </div>
  );
}

/** The distance price for each area (measured to the area's centre), so the owner can see what "auto" means. */
async function autoPrices(
  districts: string[],
  pricing: { basePence: number; baseKm: number; perKmPence: number },
): Promise<Record<string, { km: number; pence: number } | null>> {
  try {
    const kitchen = await getKitchenLocation();
    const entries = await Promise.all(
      districts.map(async (d) => {
        const centre = await lookupDistrict(d).catch(() => null);
        if (!centre) return [d, null] as const;
        const km = roadDistanceKm(kitchen, centre);
        return [d, { km, pence: distanceFeePence(km, pricing) }] as const;
      }),
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}
