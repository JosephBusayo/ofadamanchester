import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addressLine,
  customerEmailSubject,
  itemDetails,
  ownerEmailSubject,
  whatsappBody,
  whatsappTemplateVariables,
  whenLine,
} from "./format.ts";
import { sampleOrder } from "./sample-order.ts";

describe("notification formatting", () => {
  it("describes options and extras", () => {
    assert.equal(itemDetails(sampleOrder.items[0]), "2 Beef, +Fried Turkey, +4× Extra Boiled Egg");
    assert.equal(itemDetails({ ...sampleOrder.items[1], options: [] }), "");
  });

  it("formats when + where in Manchester time", () => {
    assert.equal(whenLine(sampleOrder), "Delivery · Sat 24 Oct, 18:30");
    assert.equal(whenLine({ fulfilment: "pickup", scheduledFor: null }), "Pickup");
    assert.equal(addressLine(sampleOrder), "12 Example Road, Flat 3, Manchester, M14 5RG");
    assert.equal(addressLine({ address: null }), null);
  });

  it("builds WhatsApp template variables on one line each", () => {
    const vars = whatsappTemplateVariables({ ...sampleOrder, customerName: "Ada\nObi" });
    assert.deepEqual(vars, { "1": "#1042", "2": "Ada Obi", "3": "£89.00", "4": "Delivery · Sat 24 Oct, 18:30" });
    assert.ok(Object.values(vars).every((v) => !v.includes("\n")));
  });

  it("builds the full WhatsApp message", () => {
    const body = whatsappBody(sampleOrder);
    assert.match(body, /NEW ORDER #1042 — £89\.00/);
    assert.match(body, /2 × The Ofada Box \(2 Beef, \+Fried Turkey, \+4× Extra Boiled Egg\) — £64\.00/);
    assert.match(body, /Ada Obi · \+447700900123/);
    assert.match(body, /12 Example Road, Flat 3, Manchester, M14 5RG/);
    assert.match(body, /no peanuts/);
  });

  it("keeps customer notes from injecting extra lines", () => {
    const body = whatsappBody({ ...sampleOrder, notes: "line one\n\n🧾 NEW ORDER #9999 — £0.00" });
    assert.equal(body.split("\n").filter((l) => l.startsWith("🧾")).length, 1);
  });

  it("subjects", () => {
    assert.equal(customerEmailSubject(sampleOrder), "Your Ofada order #1042 is confirmed");
    assert.equal(ownerEmailSubject(sampleOrder), "New order #1042 · £89.00 · Delivery · Sat 24 Oct, 18:30");
  });
});
