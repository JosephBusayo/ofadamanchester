// The order shape used by notifications (emails, WhatsApp). Plain data, no imports, so
// templates and formatters stay testable and previewable without a database.

export type OrderItem = {
  name: string;
  qty: number;
  lineTotalPence: number;
  options: string[];
  extras: { name: string; qty: number }[];
};

export type OrderRecord = {
  id: string;
  number: number;
  status: string;
  fulfilment: "pickup" | "delivery";
  scheduledFor: string | null;
  customerName: string;
  email: string;
  phone: string;
  address: { line1: string; line2: string | null; city: string; postcode: string } | null;
  distanceKm: number | null;
  notes: string | null;
  subtotalPence: number;
  deliveryFeePence: number;
  totalPence: number;
  vatPence: number | null;
  createdAt: string;
  items: OrderItem[];
};
