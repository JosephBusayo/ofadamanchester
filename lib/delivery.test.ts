import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { haversineKm, normalisePostcode, quoteDelivery, roadDistanceKm, type DeliveryTier } from "./delivery.ts";

// Placeholder tiers from CLAUDE.md (client to confirm).
const tiers: DeliveryTier[] = [
  { maxKm: 3, feePence: 350 },
  { maxKm: 6, feePence: 500 },
  { maxKm: 10, feePence: 750 },
];

describe("distance", () => {
  // Manchester Piccadilly → Manchester Airport is ~13.5 km in a straight line.
  const piccadilly = { lat: 53.4774, lng: -2.2309 };
  const airport = { lat: 53.3588, lng: -2.2727 };

  it("haversine is about right", () => {
    const km = haversineKm(piccadilly, airport);
    assert.ok(km > 13 && km < 14, `got ${km}`);
  });

  it("road distance applies the 1.3 factor", () => {
    assert.equal(roadDistanceKm(piccadilly, airport), Math.round(haversineKm(piccadilly, airport) * 1.3 * 100) / 100);
  });

  it("same point is zero", () => assert.equal(haversineKm(piccadilly, piccadilly), 0));
});

describe("delivery fee tiers", () => {
  const quote = (distanceKm: number, extra = {}) => quoteDelivery({ distanceKm, tiers, maxDeliveryKm: 10, ...extra });

  it("0–3 km = £3.50", () => {
    assert.deepEqual(quote(0.4), { ok: true, distanceKm: 0.4, feePence: 350 });
    assert.deepEqual(quote(3), { ok: true, distanceKm: 3, feePence: 350 });
  });

  it("3–6 km = £5.00", () => assert.deepEqual(quote(3.01), { ok: true, distanceKm: 3.01, feePence: 500 }));

  it("6–10 km = £7.50", () => assert.deepEqual(quote(10), { ok: true, distanceKm: 10, feePence: 750 }));

  it("beyond the max radius → no delivery", () => {
    assert.deepEqual(quote(10.2), { ok: false, distanceKm: 10.2, reason: "too_far" });
  });

  it("beyond the last tier → no delivery, even if under max radius", () => {
    assert.equal(quoteDelivery({ distanceKm: 8, tiers: tiers.slice(0, 2), maxDeliveryKm: 10 }).ok, false);
  });

  it("tiers are matched regardless of their order", () => {
    assert.deepEqual(
      quoteDelivery({ distanceKm: 2, tiers: [...tiers].reverse(), maxDeliveryKm: 10 }),
      { ok: true, distanceKm: 2, feePence: 350 },
    );
  });

  it("enforces a minimum order for delivery", () => {
    assert.deepEqual(quote(2, { subtotalPence: 900, minOrderPence: 1000 }), {
      ok: false,
      distanceKm: 2,
      reason: "below_minimum",
      minimumPence: 1000,
    });
    assert.equal(quote(2, { subtotalPence: 1000, minOrderPence: 1000 }).ok, true);
  });
});

describe("UK postcodes", () => {
  it("normalises valid postcodes", () => {
    assert.equal(normalisePostcode("m1 1ae"), "M1 1AE");
    assert.equal(normalisePostcode("M145RG"), "M14 5RG");
    assert.equal(normalisePostcode("  ol1   3eq "), "OL1 3EQ");
    assert.equal(normalisePostcode("SW1A 1AA"), "SW1A 1AA");
  });

  it("rejects invalid ones", () => {
    for (const bad of ["", "12345", "M1", "MANCHESTER", "M1 1A"]) {
      assert.equal(normalisePostcode(bad), null, bad);
    }
  });
});
