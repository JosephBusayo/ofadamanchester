import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  distanceFeePence,
  farDiscountPence,
  findPostcode,
  haversineKm,
  isNight,
  normaliseDistrict,
  normalisePostcode,
  postcodeDistrict,
  quoteDelivery,
  roadDistanceKm,
  type DeliveryArea,
} from "./delivery.ts";

const pricing = { basePence: 450, baseKm: 3, perKmPence: 100, farKm: 8, farDiscountPercent: 5 };
const surcharges = { nightPence: 100, nightFrom: "19:00", rainPence: 150 };
const areas: DeliveryArea[] = [
  { district: "M14", feePence: null },
  { district: "M20", feePence: 650 },
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

describe("distance price", () => {
  it("£4.50 minimum covers the first 3 km", () => {
    assert.equal(distanceFeePence(0.5, pricing), 450);
    assert.equal(distanceFeePence(3, pricing), 450);
  });

  it("adds per km after that, rounded up to 50p", () => {
    assert.equal(distanceFeePence(3.2, pricing), 500); // £4.70 → £5.00
    assert.equal(distanceFeePence(5, pricing), 650); // £6.50 exactly
    assert.equal(distanceFeePence(7.6, pricing), 950); // £9.10 → £9.50
  });
});

describe("delivery quote", () => {
  const base = { distanceKm: 5, areas, pricing, surcharges, slotTime: "13:00", raining: false };
  const quote = (postcode: string, extra = {}) => quoteDelivery({ ...base, postcode, ...extra });

  it("listed district without a fixed price → distance price", () => {
    assert.deepEqual(quote("M14 5RG"), { ok: true, distanceKm: 5, feePence: 650, breakdown: [{ label: "Delivery", pence: 650 }] });
  });

  it("fixed price is used", () => {
    const q = quote("M20 2XY");
    assert.ok(q.ok);
    assert.equal(q.feePence, 650);
  });

  it("unlisted district → not covered (sent to WhatsApp)", () => {
    assert.deepEqual(quote("M1 1AE"), { ok: false, reason: "not_covered" });
    // M1 must not match M14 by prefix
    assert.deepEqual(quoteDelivery({ ...base, postcode: "M1 1AE", areas: [{ district: "M14", feePence: null }] }), {
      ok: false,
      reason: "not_covered",
    });
  });

  it("evening surcharge from nightFrom", () => {
    const q = quote("M20 2XY", { slotTime: "19:30" });
    assert.ok(q.ok);
    assert.equal(q.feePence, 750);
    assert.deepEqual(q.breakdown.at(-1), { label: "Evening delivery", pence: 100 });
    const before = quote("M20 2XY", { slotTime: "18:59" });
    assert.ok(before.ok);
    assert.equal(before.feePence, 650);
  });

  it("rain surcharge only when raining, and stacks with night", () => {
    const q = quote("M20 2XY", { slotTime: "20:00", raining: true });
    assert.ok(q.ok);
    assert.equal(q.feePence, 650 + 100 + 150);
    assert.equal(q.breakdown.length, 3);
  });

  it("surcharges of 0 are off", () => {
    const q = quote("M20 2XY", { slotTime: "21:00", raining: true, surcharges: { nightPence: 0, nightFrom: "19:00", rainPence: 0 } });
    assert.ok(q.ok);
    assert.equal(q.feePence, 650);
  });

  it("delivery paused → paused", () => assert.deepEqual(quote("M14 5RG", { deliveryPaused: true }), { ok: false, reason: "paused" }));

  it("enforces a minimum order for delivery", () => {
    assert.deepEqual(quote("M14 5RG", { subtotalPence: 900, minOrderPence: 1000 }), {
      ok: false,
      reason: "below_minimum",
      minimumPence: 1000,
    });
    assert.equal(quote("M14 5RG", { subtotalPence: 1000, minOrderPence: 1000 }).ok, true);
  });
});

describe("long-distance discount", () => {
  it("none up to farKm", () => {
    assert.equal(farDiscountPence(950, 8, pricing), 0);
    const q = quote8("M14 5RG", 8);
    assert.ok(q.ok);
    assert.equal(q.breakdown.length, 1);
  });

  it("5% off beyond farKm, rounded to 5p, shown as its own line", () => {
    // 12 km → £4.50 + 9 × £1 = £13.50; 5% = 67.5p → 70p
    const q = quote8("M14 5RG", 12);
    assert.ok(q.ok);
    assert.deepEqual(q.breakdown, [
      { label: "Delivery", pence: 1350 },
      { label: "Long-distance discount (5%)", pence: -70 },
    ]);
    assert.equal(q.feePence, 1280);
  });

  it("applies to fixed-price areas too, but never below the £4.50 minimum", () => {
    assert.equal(farDiscountPence(460, 20, pricing), 10);
    assert.equal(farDiscountPence(450, 20, pricing), 0);
  });

  it("0% = off", () => assert.equal(farDiscountPence(2000, 30, { ...pricing, farDiscountPercent: 0 }), 0));

  it("surcharges are not discounted", () => {
    const q = quote8("M14 5RG", 12, { slotTime: "20:00", raining: true });
    assert.ok(q.ok);
    assert.equal(q.feePence, 1280 + 100 + 150);
  });
});

function quote8(postcode: string, distanceKm: number, extra = {}) {
  return quoteDelivery({ postcode, distanceKm, areas, pricing, surcharges, slotTime: "13:00", raining: false, ...extra });
}

describe("districts and night", () => {
  it("district from postcode", () => {
    assert.equal(postcodeDistrict("M14 5RG"), "M14");
    assert.equal(postcodeDistrict("SW1A 1AA"), "SW1A");
  });
  it("normalises districts", () => {
    assert.equal(normaliseDistrict(" m14 "), "M14");
    assert.equal(normaliseDistrict("sk4"), "SK4");
    assert.equal(normaliseDistrict("M14 5RG"), null);
    assert.equal(normaliseDistrict("14"), null);
  });
  it("night runs from nightFrom to 06:00", () => {
    assert.equal(isNight("19:00", "19:00"), true);
    assert.equal(isNight("23:30", "19:00"), true);
    assert.equal(isNight("02:00", "19:00"), true);
    assert.equal(isNight("12:00", "19:00"), false);
  });
});

describe("UK postcodes", () => {
  it("finds a postcode inside free text", () => {
    assert.equal(findPostcode("M72BA Salford Manchester"), "M7 2BA");
    assert.equal(findPostcode("m7 2ba"), "M7 2BA");
    assert.equal(findPostcode("Kitchen, 12 High St, Salford M7 2BA, UK"), "M7 2BA");
    assert.equal(findPostcode("Salford Manchester"), null);
  });

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
