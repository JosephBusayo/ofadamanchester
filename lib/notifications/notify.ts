import "server-only";

import { getSettings } from "@/lib/settings";
import { sendCustomerConfirmation, sendOwnerNewOrder } from "./email";
import type { OrderRecord } from "./order-types";
import { sendOwnerWhatsApp } from "./whatsapp";

export type ChannelResult = {
  channel: "customer email" | "owner email" | "owner WhatsApp";
  status: "sent" | "skipped" | "failed";
  /** Why it failed or was skipped — safe to show to the admin (no secrets). */
  detail?: string;
};

const SKIP_REASONS: Record<ChannelResult["channel"], string> = {
  "customer email": "RESEND_API_KEY or EMAIL_FROM not set",
  "owner email": "RESEND_API_KEY, EMAIL_FROM or OWNER_EMAIL not set",
  "owner WhatsApp": "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM or OWNER_WHATSAPP not set",
};

/**
 * Sends all "new paid order" notifications. Each channel is independent: if WhatsApp
 * fails the emails still go out (and vice versa). Failures are logged and reported,
 * never thrown, so the webhook still acknowledges Stripe.
 */
export async function notifyNewOrder(
  order: OrderRecord,
  opts: { warning?: string; idempotencySuffix?: string } = {},
): Promise<ChannelResult[]> {
  const settings = await getSettings();
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/orders/${order.id}`;

  const channels: ChannelResult["channel"][] = ["customer email", "owner email", "owner WhatsApp"];
  const settled = await Promise.allSettled([
    sendCustomerConfirmation(order, settings.pickupAddress, opts.idempotencySuffix),
    sendOwnerNewOrder(order, adminUrl, opts.warning, opts.idempotencySuffix),
    sendOwnerWhatsApp(order),
  ]);

  const results = settled.map((r, i): ChannelResult => {
    const channel = channels[i];
    if (r.status === "rejected") {
      console.error(`[order #${order.number}] ${channel} failed:`, r.reason);
      return { channel, status: "failed", detail: r.reason instanceof Error ? r.reason.message : String(r.reason) };
    }
    return r.value === "skipped" ? { channel, status: "skipped", detail: SKIP_REASONS[channel] } : { channel, status: "sent" };
  });
  console.info(`[order #${order.number}] notifications — ${results.map((r) => `${r.channel}: ${r.status}`).join(", ")}`);
  return results;
}
