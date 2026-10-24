"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { isAllowedTransition, type OrderStatus } from "@/lib/admin/order-status";
import { sendCustomerConfirmation } from "@/lib/notifications/email";
import { getOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";

export type ActionResult = { ok: boolean; message: string };

const idSchema = z.uuid();
const statusSchema = z.enum(["preparing", "ready", "out_for_delivery", "completed", "cancelled"]);

export async function updateOrderStatusAction(orderId: string, to: string): Promise<ActionResult> {
  const { db } = await requireAdmin();
  const id = idSchema.safeParse(orderId);
  const next = statusSchema.safeParse(to);
  if (!id.success || !next.success) return { ok: false, message: "Invalid request." };

  const { data: order } = await db.from("orders").select("status, fulfilment").eq("id", id.data).maybeSingle();
  if (!order) return { ok: false, message: "Order not found." };
  if (!isAllowedTransition(order.status as OrderStatus, next.data, order.fulfilment)) {
    return { ok: false, message: "That step isn't available for this order any more. Refresh the page." };
  }

  // Conditional on the current status, so two devices can't both move the same order.
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: next.data })
    .eq("id", id.data)
    .eq("status", order.status)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: `Couldn't update the order: ${error.message}` };
  if (!updated) return { ok: false, message: "Someone else just updated this order. Refresh the page." };

  refresh();
  return {
    ok: true,
    message: next.data === "cancelled" ? "Order cancelled. Remember to refund it in Stripe." : "Order updated.",
  };
}

export async function resendConfirmationAction(orderId: string): Promise<ActionResult> {
  const { db } = await requireAdmin();
  const id = idSchema.safeParse(orderId);
  if (!id.success) return { ok: false, message: "Invalid request." };
  const order = await getOrder(db, id.data);
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status === "pending" || order.status === "cancelled") {
    return { ok: false, message: "Only paid orders get a confirmation email." };
  }
  try {
    const settings = await getSettings();
    const result = await sendCustomerConfirmation(order, settings.pickupAddress, String(Date.now()));
    return result === "sent"
      ? { ok: true, message: `Confirmation re-sent to ${order.email}.` }
      : { ok: false, message: "Email isn't set up yet (RESEND_API_KEY / EMAIL_FROM)." };
  } catch (err) {
    console.error("Resend confirmation failed", err);
    return { ok: false, message: "Sending failed — please try again." };
  }
}
