import "server-only";

import { whatsappBody, whatsappTemplateVariables } from "./format";
import type { OrderRecord } from "./order-types";

/**
 * Sends the owner a WhatsApp alert. Two providers, Twilio first:
 * 1. Twilio (paid, official) — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 * 2. CallMeBot (free, for messaging your OWN number) — CALLMEBOT_APIKEY. The owner gets the key
 *    by sending "I allow callmebot to send me messages" to CallMeBot's WhatsApp number.
 * Both send to OWNER_WHATSAPP.
 */
export async function sendOwnerWhatsApp(order: OrderRecord): Promise<"sent" | "skipped"> {
  const to = process.env.OWNER_WHATSAPP;
  if (!to) return "skipped";
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
    return sendViaTwilio(order);
  }
  if (process.env.CALLMEBOT_APIKEY) return sendViaCallMeBot(order, to, process.env.CALLMEBOT_APIKEY);
  return "skipped";
}

/** Free personal-use API: free text (full order), to the owner's own WhatsApp only. */
async function sendViaCallMeBot(order: OrderRecord, to: string, apikey: string): Promise<"sent"> {
  const url =
    "https://api.callmebot.com/whatsapp.php?" +
    new URLSearchParams({ phone: to.replace(/[^\d]/g, ""), text: whatsappBody(order), apikey });
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const body = await res.text().catch(() => "");
  // CallMeBot answers 200 with an HTML page; failures mention an error / invalid key.
  if (!res.ok || /error|invalid|not (?:allowed|activated)/i.test(body)) {
    throw new Error(`CallMeBot ${res.status}: ${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)}`);
  }
  return "sent";
}

/**
 * Twilio REST API.
 * - With TWILIO_WHATSAPP_TEMPLATE_SID: uses the approved template (required for
 *   business-initiated messages in production).
 * - Without it: sends the full order as free text (works in the Twilio sandbox, or
 *   within 24h of the owner messaging the business number).
 */
async function sendViaTwilio(order: OrderRecord): Promise<"sent" | "skipped"> {
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
