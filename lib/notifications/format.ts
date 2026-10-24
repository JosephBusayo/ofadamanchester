// Text formatting for notifications. Pure — unit-tested with `node --test`.

import { formatPence } from "../pricing.ts";
import { formatSlot } from "../schedule.ts";
import type { OrderItem, OrderRecord } from "./order-types.ts";

export function itemDetails(item: OrderItem): string {
  return [...item.options, ...item.extras.map((e) => `+${e.qty > 1 ? `${e.qty}× ` : ""}${e.name}`)].join(", ");
}

export function whenLine(order: Pick<OrderRecord, "fulfilment" | "scheduledFor">): string {
  const kind = order.fulfilment === "delivery" ? "Delivery" : "Pickup";
  return order.scheduledFor ? `${kind} · ${formatSlot(order.scheduledFor)}` : kind;
}

export function addressLine(order: Pick<OrderRecord, "address">): string | null {
  const a = order.address;
  return a ? [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ") : null;
}

/** Strip characters that would break a one-line WhatsApp template variable. */
function oneLine(s: string, max = 200): string {
  return s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

/**
 * Variables for the approved WhatsApp template, e.g.
 * "New order {{1}} – {{2}} – {{3}} – {{4}}" → "#1042 – Ada Obi – £64.00 – Pickup · Sat 24 Oct, 18:30".
 */
export function whatsappTemplateVariables(order: OrderRecord): Record<string, string> {
  return {
    "1": `#${order.number}`,
    "2": oneLine(order.customerName, 80),
    "3": formatPence(order.totalPence),
    "4": oneLine(whenLine(order)),
  };
}

/** Free-text message (Twilio sandbox / 24-hour session) with the full order. */
export function whatsappBody(order: OrderRecord): string {
  const lines = [
    `🧾 NEW ORDER #${order.number} — ${formatPence(order.totalPence)}`,
    whenLine(order),
    "",
    ...order.items.map((i) => {
      const details = itemDetails(i);
      return `${i.qty} × ${i.name}${details ? ` (${details})` : ""} — ${formatPence(i.lineTotalPence)}`;
    }),
    "",
    `👤 ${oneLine(order.customerName, 80)} · ${order.phone}`,
  ];
  const address = addressLine(order);
  if (address) lines.push(`📍 ${oneLine(address)}`);
  if (order.notes) lines.push(`📝 ${oneLine(order.notes, 300)}`);
  return lines.join("\n");
}

export function ownerEmailSubject(order: OrderRecord): string {
  return `New order #${order.number} · ${formatPence(order.totalPence)} · ${whenLine(order)}`;
}

export function customerEmailSubject(order: OrderRecord): string {
  return `Your Ofada order #${order.number} is confirmed`;
}
