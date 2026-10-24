import "server-only";

import { whatsappBody, whatsappTemplateVariables } from "./format";
import type { OrderRecord } from "./order-types";

/**
 * Sends the owner a WhatsApp via Twilio's REST API.
 * - With TWILIO_WHATSAPP_TEMPLATE_SID: uses the approved template (required for
 *   business-initiated messages in production).
 * - Without it: sends the full order as free text (works in the Twilio sandbox, or
 *   within 24h of the owner messaging the business number).
 */
export async function sendOwnerWhatsApp(order: OrderRecord): Promise<"sent" | "skipped"> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. +14155238886 (sandbox)
  const to = process.env.OWNER_WHATSAPP;
  if (!sid || !token || !from || !to) return "skipped";

  const form = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}` });
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
  if (templateSid) {
    form.set("ContentSid", templateSid);
    form.set("ContentVariables", JSON.stringify(whatsappTemplateVariables(order)));
  } else {
    form.set("Body", whatsappBody(order));
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio ${res.status}: ${detail.slice(0, 300)}`);
  }
  return "sent";
}
