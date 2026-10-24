import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  availableSlots,
  formatOpeningHours,
  formatSlot,
  isValidSlot,
  londonDayBounds,
  londonParts,
  londonToday,
  londonToUtc,
  type ScheduleSettings,
} from "./schedule.ts";

const settings: ScheduleSettings = {
  // Closed Mondays; Saturday has a lunch and an evening service.
  openingHours: {
    "0": [{ open: "12:00", close: "18:00" }],
    "2": [{ open: "12:00", close: "20:00" }],
    "3": [{ open: "12:00", close: "20:00" }],
    "4": [{ open: "12:00", close: "20:00" }],
    "5": [{ open: "12:00", close: "21:00" }],
    "6": [
      { open: "11:00", close: "14:00" },
      { open: "17:00", close: "21:00" },
    ],
  },
  leadTimeMinutes: 45,
  slotMinutes: 30,
  daysAhead: 7,
};

describe("Manchester time", () => {
  it("winter (GMT): 18:00 local = 18:00 UTC", () => {
    assert.equal(londonToUtc(2026, 12, 5, 18, 0).toISOString(), "2026-12-05T18:00:00.000Z");
  });

  it("summer (BST): 18:00 local = 17:00 UTC", () => {
    assert.equal(londonToUtc(2026, 7, 4, 18, 0).toISOString(), "2026-07-04T17:00:00.000Z");
  });

  it("clock-change day (BST ends 25 Oct 2026)", () => {
    assert.equal(londonToUtc(2026, 10, 25, 0, 30).toISOString(), "2026-10-24T23:30:00.000Z"); // still BST
    assert.equal(londonToUtc(2026, 10, 25, 12, 0).toISOString(), "2026-10-25T12:00:00.000Z"); // GMT
  });

  it("reads wall-clock parts", () => {
    assert.deepEqual(londonParts(new Date("2026-07-04T17:00:00Z")), { year: 2026, month: 7, day: 4, hour: 18, minute: 0 });
  });

  it("formats a slot", () => assert.equal(formatSlot("2026-10-24T17:30:00.000Z"), "Sat 24 Oct, 18:30"));

  it("day bounds handle the 25-hour clock-change day", () => {
    const { start, end } = londonDayBounds("2026-10-25");
    assert.equal(start.toISOString(), "2026-10-24T23:00:00.000Z");
    assert.equal(end.toISOString(), "2026-10-26T00:00:00.000Z");
    assert.equal(londonToday(new Date("2026-10-24T23:30:00Z")), "2026-10-25");
  });
});

describe("opening hours display", () => {
  it("groups days with the same hours, Monday first", () => {
    assert.deepEqual(formatOpeningHours(settings.openingHours), [
      "Mon · Closed",
      "Tue – Thu · 12:00 – 20:00",
      "Fri · 12:00 – 21:00",
      "Sat · 11:00 – 14:00, 17:00 – 21:00",
      "Sun · 12:00 – 18:00",
    ]);
  });

  it("says 'Every day' when all days match", () => {
    const same = { open: "12:00", close: "20:00" };
    const hours = Object.fromEntries(["0", "1", "2", "3", "4", "5", "6"].map((d) => [d, [same]]));
    assert.deepEqual(formatOpeningHours(hours), ["Every day · 12:00 – 20:00"]);
  });
});

describe("time slots", () => {
  it("respects the lead time", () => {
    // Fri 23 Oct 2026, 13:10 BST → earliest 13:55 → first slot 14:00.
    const now = new Date("2026-10-23T12:10:00Z");
    const [today] = availableSlots(settings, now);
    assert.equal(today.label, "Today");
    assert.equal(today.slots[0].time, "14:00");
    assert.equal(today.slots.at(-1)!.time, "21:00");
  });

  it("skips closed days and days with no slots left", () => {
    // Fri 23 Oct 2026 at 21:30 → nothing left today; Monday 26 is closed.
    const days = availableSlots(settings, new Date("2026-10-23T20:30:00Z"));
    const labels = days.map((d) => d.label);
    assert.equal(labels[0], "Tomorrow");
    assert.ok(!days.some((d) => d.weekday === 1), "no Monday");
  });

  it("supports split services (Saturday lunch + evening)", () => {
    const days = availableSlots(settings, new Date("2026-10-23T08:00:00Z"));
    const saturday = days.find((d) => d.weekday === 6)!;
    const times = saturday.slots.map((s) => s.time);
    assert.ok(times.includes("13:30") && times.includes("14:00") && times.includes("17:00"));
    assert.ok(!times.includes("15:00"), "closed between services");
  });

  it("slots across the clock change keep their local times", () => {
    // Sunday 25 Oct 2026 (GMT from 02:00): 12:00 local = 12:00 UTC.
    const days = availableSlots(settings, new Date("2026-10-23T08:00:00Z"));
    const sunday = days.find((d) => d.weekday === 0)!;
    assert.equal(sunday.slots[0].time, "12:00");
    assert.equal(sunday.slots[0].iso, "2026-10-25T12:00:00.000Z");
  });

  it("only offers days within the booking window", () => {
    const days = availableSlots(settings, new Date("2026-10-23T08:00:00Z"));
    assert.ok(days.every((d) => d.date >= "2026-10-23" && d.date <= "2026-10-29"));
  });

  it("validates submitted slots", () => {
    const now = new Date("2026-10-23T12:10:00Z");
    assert.equal(isValidSlot("2026-10-23T13:00:00.000Z", settings, now), true); // 14:00 BST
    assert.equal(isValidSlot("2026-10-23T12:30:00.000Z", settings, now), false); // inside lead time
    assert.equal(isValidSlot("2026-10-26T12:00:00.000Z", settings, now), false); // Monday, closed
    assert.equal(isValidSlot("2026-10-23T13:10:00.000Z", settings, now), false); // not on the grid
  });
});
