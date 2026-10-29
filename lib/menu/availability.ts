// "Saturdays only", "Fridays & Saturdays only" … for items not sold every day.
const DAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

export function availabilityNote(availableDays: number[] | null | undefined): string | null {
  if (!availableDays || availableDays.length === 0 || availableDays.length === 7) return null;
  const names = [...availableDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAYS[d]);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
  return `${list} only`;
}
