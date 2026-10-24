import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderRecord } from "./notifications/order-types";

export const ORDER_SELECT =
  "id, order_number, status, fulfilment, scheduled_for, customer_name, email, phone, address_line1, address_line2, city, postcode, distance_km, notes, subtotal_pence, delivery_fee_pence, total_pence, vat_pence, created_at, order_items (product_name, qty, line_total_pence, options, extras)";

type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  fulfilment: "pickup" | "delivery";
  scheduled_for: string | null;
  customer_name: string;
  email: string;
  phone: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  distance_km: number | string | null;
  notes: string | null;
  subtotal_pence: number;
  delivery_fee_pence: number;
  total_pence: number;
  vat_pence: number | null;
  created_at: string;
  order_items: {
    product_name: string;
    qty: number;
    line_total_pence: number;
    options: { name: string }[] | null;
    extras: { name: string; qty: number }[] | null;
  }[];
};

export function toOrderRecord(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    number: row.order_number,
    status: row.status,
    fulfilment: row.fulfilment,
    scheduledFor: row.scheduled_for,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address:
      row.fulfilment === "delivery" && row.address_line1
        ? { line1: row.address_line1, line2: row.address_line2, city: row.city ?? "", postcode: row.postcode ?? "" }
        : null,
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    notes: row.notes,
    subtotalPence: row.subtotal_pence,
    deliveryFeePence: row.delivery_fee_pence,
    totalPence: row.total_pence,
    vatPence: row.vat_pence,
    createdAt: row.created_at,
    items: row.order_items.map((i) => ({
      name: i.product_name,
      qty: i.qty,
      lineTotalPence: i.line_total_pence,
      options: (i.options ?? []).map((o) => o.name),
      extras: (i.extras ?? []).map((e) => ({ name: e.name, qty: e.qty })),
    })),
  };
}

export async function getOrder(db: SupabaseClient, id: string): Promise<OrderRecord | null> {
  const { data, error } = await db.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load order ${id}: ${error.message}`);
  return data ? toOrderRecord(data as unknown as OrderRow) : null;
}
