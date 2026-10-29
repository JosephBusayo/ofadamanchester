import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { availabilityNote } from "./availability.ts";

describe("availability note", () => {
  it("every day → none", () => {
    assert.equal(availabilityNote(null), null);
    assert.equal(availabilityNote([0, 1, 2, 3, 4, 5, 6]), null);
  });
  it("Saturday only", () => assert.equal(availabilityNote([6]), "Saturdays only"));
  it("several days, Monday first", () => assert.equal(availabilityNote([6, 0, 5]), "Fridays, Saturdays & Sundays only"));
});
