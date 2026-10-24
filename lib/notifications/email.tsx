import "server-only";

import { Resend } from "resend";
import { CustomerOrderConfirmation } from "@/emails/CustomerOrderConfirmation";
import { OwnerNewOrder } from "@/emails/OwnerNewOrder";
import { customerEmailSubject, ownerEmailSubject } from "./format";
import type { OrderRecord } from "./order-types";

let client: Resend | null = null;
function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

async function send(
  payload: { to: string; subject: string; react: React.ReactElement; replyTo?: string },
  idempotencyKey: string,
): Promise<"sent" | "skipped"> {
  const r = resend();
  const from = process.env.EMAIL_FROM; // e.g. "Ofada Manchester <orders@yourdomain.co.uk>"
  if (!r || !from) return "skipped";
  // Idempotency key: if Stripe retries the webhook, Resend won't send a duplicate.
  const { error } = await r.emails.send({ from, ...payload }, { idempotencyKey });
  if (error) throw new Error(`Resend: ${error.message}`);
  return "sent";
}

/** `resendId` makes a manual resend (from admin) a distinct send instead of a deduplicated retry. */
export function sendCustomerConfirmation(order: OrderRecord, pickupAddress: string, resendId?: string) {
  return send(
    {
      to: order.email,
      subject: customerEmailSubject(order),
      react: <CustomerOrderConfirmation order={order} pickupAddress={pickupAddress} />,
      replyTo: process.env.OWNER_EMAIL || undefined,
    },
    `order-${order.id}-customer${resendId ? `-resend-${resendId}` : ""}`,
  );
}

export function sendOwnerNewOrder(order: OrderRecord, adminUrl: string, warning?: string) {
  const to = process.env.OWNER_EMAIL;
  if (!to) return Promise.resolve("skipped" as const);
  return send(
    {
      to,
      subject: `${warning ? "⚠ " : ""}${ownerEmailSubject(order)}`,
      react: <OwnerNewOrder order={order} adminUrl={adminUrl} warning={warning} />,
      replyTo: order.email,
    },
    `order-${order.id}-owner`,
  );
}
