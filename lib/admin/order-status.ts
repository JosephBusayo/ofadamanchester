// Order status flow for the kitchen. Pure — unit-tested.
//   paid → preparing → ready (pickup) / out_for_delivery (delivery) → completed
//   any paid stage → cancelled (refund in Stripe)

export type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Unpaid",
  paid: "New",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

const CANCELLABLE: OrderStatus[] = ["paid", "preparing", "ready", "out_for_delivery"];

/** The forward step(s) the kitchen can take from `status`. */
export function nextStatuses(status: OrderStatus, fulfilment: "pickup" | "delivery"): OrderStatus[] {
  switch (status) {
    case "paid":
      return ["preparing"];
    case "preparing":
      return [fulfilment === "delivery" ? "out_for_delivery" : "ready"];
    case "ready":
    case "out_for_delivery":
      return ["completed"];
    default:
      return [];
  }
}

export function canCancel(status: OrderStatus): boolean {
  return CANCELLABLE.includes(status);
}

export function isAllowedTransition(from: OrderStatus, to: OrderStatus, fulfilment: "pickup" | "delivery"): boolean {
  if (to === "cancelled") return canCancel(from);
  return nextStatuses(from, fulfilment).includes(to);
}

/** Button text for moving to a status. */
export const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  preparing: "Start preparing",
  ready: "Mark ready for pickup",
  out_for_delivery: "Mark out for delivery",
  completed: "Mark completed",
  cancelled: "Cancel order",
};

/** Order list filters. "active" = what the kitchen needs to deal with. */
export const STATUS_FILTERS = {
  active: ["paid", "preparing", "ready", "out_for_delivery"],
  completed: ["completed"],
  unpaid: ["pending", "cancelled"],
  all: ["pending", "paid", "preparing", "ready", "out_for_delivery", "completed", "cancelled"],
} satisfies Record<string, OrderStatus[]>;

export type StatusFilter = keyof typeof STATUS_FILTERS;
