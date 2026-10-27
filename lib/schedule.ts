// Opening hours & collection/delivery time slots, always in Manchester time
// (Europe/London, including BST). Pure — no runtime imports — so it runs in the
// browser (slot picker), on the server (validation) and under `node --test`.

export const TIME_ZONE = "Europe/London";

/** Day of week ("0" = Sunday … "6" = Saturday) → open periods, e.g. [{ open: "12:00", close: "20:00" }]. */
export type OpeningHours = Partial<Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", { open: string; close: string }[]>>;

export type ScheduleSettings = {
  openingHours: OpeningHours;
  leadTimeMinutes: number; // earliest slot = now + lead time
  slotMinutes: number; // spacing between slots
  daysAhead: number; // how many days customers can book ahead (incl. today)
};

export type Slot = { iso: string; time: string };
export type SlotDay = { date: string; weekday: number; label: string; slots: Slot[] };

const PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Wall-clock parts of `date` in Manchester. */
export function londonParts(date: Date) {
  const p = Object.fromEntries(PARTS.formatToParts(date).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute };
}

function offsetMs(date: Date): number {
  const p = londonParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(date.getTime() / 60000) * 60000;
}

/** The instant when Manchester clocks show the given date and time. */
export function londonToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = guess - offsetMs(new Date(guess));
  // Re-check once in case the guess and the answer straddle a clock change.
  return new Date(guess - offsetMs(new Date(first)));
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const pad = (n: number) => String(n).padStart(2, "0");
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Bookable days (only those with at least one slot left), each with its slots. */
export function availableSlots(settings: ScheduleSettings, now: Date = new Date()): SlotDay[] {
  const earliest = now.getTime() + settings.leadTimeMinutes * 60_000;
  const today = londonParts(now);
  const days: SlotDay[] = [];

  for (let i = 0; i < settings.daysAhead; i++) {
    // Calendar arithmetic on a UTC date avoids DST surprises.
    const cal = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    const [y, m, d, weekday] = [cal.getUTCFullYear(), cal.getUTCMonth() + 1, cal.getUTCDate(), cal.getUTCDay()];
    const periods = settings.openingHours[String(weekday) as keyof OpeningHours] ?? [];
    const slots: Slot[] = [];
    for (const period of periods) {
      for (let t = toMinutes(period.open); t <= toMinutes(period.close); t += settings.slotMinutes) {
        const at = londonToUtc(y, m, d, Math.floor(t / 60), t % 60);
        if (at.getTime() >= earliest) slots.push({ iso: at.toISOString(), time: `${pad(Math.floor(t / 60))}:${pad(t % 60)}` });
      }
    }
    if (slots.length) {
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${DAY_NAMES[weekday]} ${d} ${MONTHS[m - 1]}`;
      days.push({ date: `${y}-${pad(m)}-${pad(d)}`, weekday, label, slots });
    }
  }
  return days;
}

/** Server-side check that a submitted slot is one we'd actually offer right now. */
export function isValidSlot(iso: string, settings: ScheduleSettings, now: Date = new Date()): boolean {
  return availableSlots(settings, now).some((day) => day.slots.some((s) => s.iso === iso));
}

/**
 * Opening hours as display lines, grouping consecutive days with identical hours
 * (Monday first): ["Mon – Thu · 11:00 – 22:00", "Fri · 11:00 – 14:00, 17:00 – 23:00", "Sun · Closed"].
 */
export function formatOpeningHours(hours: OpeningHours): string[] {
  const order = ["1", "2", "3", "4", "5", "6", "0"] as const;
  const describe = (d: (typeof order)[number]) => {
    const periods = hours[d] ?? [];
    return periods.length ? periods.map((p) => `${p.open} – ${p.close}`).join(", ") : "Closed";
  };
  const lines: string[] = [];
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && describe(order[j + 1]) === describe(order[i])) j++;
    const first = DAY_NAMES[Number(order[i])];
    const days = i === j ? first : `${first} – ${DAY_NAMES[Number(order[j])]}`;
    lines.push(`${i === 0 && j === order.length - 1 ? "Every day" : days} · ${describe(order[i])}`);
    i = j + 1;
  }
  return lines;
}

/** Today's date in Manchester as "YYYY-MM-DD". */
export function londonToday(now: Date = new Date()): string {
  const p = londonParts(now);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** [start, end) instants of a Manchester calendar day "YYYY-MM-DD" (23 or 25 hours on clock-change days). */
export function londonDayBounds(date: string): { start: Date; end: Date } {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return {
    start: londonToUtc(y, m, d, 0, 0),
    end: londonToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0),
  };
}

/** Minimum notice as words: 1440 → "24 hours", 30 → "30 minutes". */
export function noticeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

/** "18:30" in Manchester time. */
export function formatTime(iso: string): string {
  const p = londonParts(new Date(iso));
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "Sat 24 Oct, 18:30" in Manchester time. */
export function formatSlot(iso: string): string {
  const date = new Date(iso);
  const p = londonParts(date);
  const weekday = DAY_NAMES[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];
  return `${weekday} ${p.day} ${MONTHS[p.month - 1]}, ${pad(p.hour)}:${pad(p.minute)}`;
}
