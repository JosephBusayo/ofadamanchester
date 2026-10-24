import "server-only";

import { getSettings } from "@/lib/settings";
import { sendCustomerConfirmation, sendOwnerNewOrder } from "./email";
import type { OrderRecord } from "./order-types";
import { sendOwnerWhatsApp } from "./whatsapp";

/**
 * Sends all "new paid order" notifications. Each channel is independent: if WhatsApp
 * fails the emails still go out (and vice versa). Failures are logged, never thrown,
 * so the webhook still acknowledges Stripe.
 */
export async function notifyNewOrder(order: OrderRecord, opts: { warning?: string } = {}) {
  const settings = await getSettings();
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/orders/${order.id}`;

  const results = await Promise.allSettled([
    sendCustomerConfirmation(order, settings.pickupAddress),
    sendOwnerNewOrder(order, adminUrl, opts.warning),
    sendOwnerWhatsApp(order),
  ]);

  const channels = ["customer email", "owner email", "owner WhatsApp"];
  const summary = results.map((r, i) => {
    if (r.status === "rejected") {
      console.error(`[order #${order.number}] ${channels[i]} failed:`, r.reason);
      return `${channels[i]}: failed`;
    }
    return `${channels[i]}: ${r.value}`;
  });
  console.info(`[order #${order.number}] notifications — ${summary.join(", ")}`);
  return results;
}
