/**
 * Date utilities for the domain layer.
 * All date-keyed data uses "YYYY-MM-DD" keys in the user's local timezone.
 */

const DAY_MS = 86_400_000;

export type Period = "day" | "week" | "month" | "year";

/** "YYYY-MM-DD" for a date in the given timezone (falls back to system tz). */
export function toDateKey(date: Date, tz?: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  });
  return fmt.format(date); // en-CA yields YYYY-MM-DD
}

export function todayKey(tz?: string): string {
  return toDateKey(new Date(), tz);
}

/** Parse "YYYY-MM-DD" into a local Date at 00:00:00. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function addDaysToKey(key: string, days: number): string {
  return toDateKey(addDays(fromDateKey(key), days));
}

/** Monday-based ISO week number. */
export function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

/** Monday-based week key, e.g. "2026-W32". */
export function toWeekKey(key: string): string {
  const date = fromDateKey(key);
  return `${date.getFullYear()}-W${String(weekNumber(date)).padStart(2, "0")}`;
}

export function toMonthKey(key: string): string {
  return key.slice(0, 7);
}

export function toYearKey(key: string): string {
  return key.slice(0, 4);
}

export function periodKeyFor(period: Period, key: string): string {
  switch (period) {
    case "day":
      return key;
    case "week":
      return toWeekKey(key);
    case "month":
      return toMonthKey(key);
    case "year":
      return toYearKey(key);
  }
}

/** Start of the week (Monday) as a date key. */
export function startOfWeekKey(key: string): string {
  const date = fromDateKey(key);
  const day = date.getDay() === 0 ? 7 : date.getDay();
  return toDateKey(addDays(date, 1 - day));
}

/** Start of month as a date key. */
export function startOfMonthKey(key: string): string {
  return key.slice(0, 8) + "01";
}

/** Number of days in the month containing `key`. */
export function daysInMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** The list of date keys from start to end inclusive. */
export function dateKeyRange(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cur = startKey;
  let guard = 0;
  while (cur <= endKey && guard < 4000) {
    keys.push(cur);
    cur = addDaysToKey(cur, 1);
    guard++;
  }
  return keys;
}

/** Last `count` days ending today (or ending at `endKey`). */
export function lastNDays(count: number, endKey?: string): string[] {
  const end = endKey ?? todayKey();
  return dateKeyRange(addDaysToKey(end, -(count - 1)), end);
}

export function relativeDayLabel(key: string, tz?: string): string {
  const today = todayKey(tz);
  const diff = Math.round((fromDateKey(key).getTime() - fromDateKey(today).getTime()) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" }).format(
    fromDateKey(key)
  );
}
