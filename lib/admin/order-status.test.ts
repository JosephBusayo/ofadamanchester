import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canCancel, isAllowedTransition, nextStatuses } from "./order-status.ts";

describe("order status flow", () => {
  it("pickup: paid → preparing → ready → completed", () => {
    assert.deepEqual(nextStatuses("paid", "pickup"), ["preparing"]);
    assert.deepEqual(nextStatuses("preparing", "pickup"), ["ready"]);
    assert.deepEqual(nextStatuses("ready", "pickup"), ["completed"]);
    assert.deepEqual(nextStatuses("completed", "pickup"), []);
  });

  it("delivery goes out for delivery instead of ready", () => {
    assert.deepEqual(nextStatuses("preparing", "delivery"), ["out_for_delivery"]);
    assert.deepEqual(nextStatuses("out_for_delivery", "delivery"), ["completed"]);
  });

  it("unpaid and cancelled orders can't be progressed", () => {
    assert.deepEqual(nextStatuses("pending", "pickup"), []);
    assert.deepEqual(nextStatuses("cancelled", "delivery"), []);
    assert.equal(isAllowedTransition("pending", "preparing", "pickup"), false);
  });

  it("no skipping steps or going backwards", () => {
    assert.equal(isAllowedTransition("paid", "completed", "pickup"), false);
    assert.equal(isAllowedTransition("ready", "preparing", "pickup"), false);
    assert.equal(isAllowedTransition("preparing", "ready", "delivery"), false);
  });

  it("cancel only while the order is live", () => {
    for (const s of ["paid", "preparing", "ready", "out_for_delivery"] as const) assert.equal(canCancel(s), true, s);
    for (const s of ["pending", "completed", "cancelled"] as const) assert.equal(canCancel(s), false, s);
    assert.equal(isAllowedTransition("completed", "cancelled", "pickup"), false);
  });
});
