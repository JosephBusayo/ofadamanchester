// A realistic sample order for email previews (/dev/emails) and tests.
import type { OrderRecord } from "./order-types.ts";

export const sampleOrder: OrderRecord = {
  id: "00000000-0000-4000-8000-000000000000",
  number: 1042,
  status: "paid",
  fulfilment: "delivery",
  scheduledFor: "2026-10-24T17:30:00.000Z",
  customerName: "Ada Obi",
  email: "ada@example.com",
  phone: "+447700900123",
  address: { line1: "12 Example Road", line2: "Flat 3", city: "Manchester", postcode: "M14 5RG" },
  distanceKm: 4.2,
  notes: "Please ring the bell — no peanuts please.",
  subtotalPence: 8400,
  deliveryFeePence: 500,
  totalPence: 8900,
  vatPence: null,
  createdAt: "2026-10-24T16:41:00.000Z",
  items: [
    {
      name: "The Ofada Box",
      qty: 2,
      lineTotalPence: 6400,
      options: ["2 Beef"],
      extras: [
        { name: "Fried Turkey", qty: 1 },
        { name: "Extra Boiled Egg", qty: 4 },
      ],
    },
    { name: "Classic Ofada Sauce", qty: 1, lineTotalPence: 2000, options: ["1 Litre"], extras: [] },
  ],
};
