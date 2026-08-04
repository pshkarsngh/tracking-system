/**
 * Streak computation (spec §6).
 * A streak is a run of consecutive days (per habit, or globally for "any activity").
 */

export interface StreakResult {
  current: number;
  best: number;
}

/**
 * Compute current + best streak from a set of active date keys.
 *
 * @param activeKeys Set of "YYYY-MM-DD" keys where the activity happened.
 * @param todayKey   Today's date key ("YYYY-MM-DD").
 * @param allowTodayGrace When true, today doesn't need to be active yet (streak not broken until end of day).
 */
export function computeStreak(activeKeys: Set<string>, todayKey: string, allowTodayGrace = true): StreakResult {
  const keys = [...activeKeys].sort();

  if (keys.length === 0) return { current: 0, best: 0 };

  // Build a lookup and walk consecutive runs.
  let current = 0;
  let best = 0;
  let run = 0;
  let prev: string | null = null;

  for (const key of keys) {
    if (prev !== null && isConsecutive(prev, key)) {
      run++;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = key;
    current = run;
  }

  if (allowTodayGrace) {
    // Current streak from the most recent run must touch today (or yesterday, since today isn't done yet).
    const last = keys[keys.length - 1];
    const todayIndex = dayIndex(todayKey);
    const lastIndex = dayIndex(last);
    const diff = todayIndex - lastIndex;
    if (diff > 1) current = 0; // gap of 2+ days before today breaks it
    else if (diff === 1) {
      // last active day was yesterday; streak continues into today (grace) only if today isn't a gap
      current = currentRun(keys, last, todayKey);
    }
  } else {
    const last = keys[keys.length - 1];
    if (dayIndex(todayKey) - dayIndex(last) > 0) current = 0;
  }

  return { current, best };
}

function isConsecutive(a: string, b: string): boolean {
  return dayIndex(b) - dayIndex(a) === 1;
}

function dayIndex(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function currentRun(keys: string[], lastActive: string, todayKey: string): number {
  let run = 0;
  let cur = todayKey;
  for (let i = keys.length - 1; i >= 0; i--) {
    if (keys[i] === cur || (i === keys.length - 1 && isConsecutive(keys[i], cur))) {
      run++;
      cur = shift(cur, -1);
    } else if (dayIndex(cur) - dayIndex(keys[i]) > 1) {
      break;
    }
  }
  return run;
}

function shift(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Best streak of N consecutive active days within a key range. */
export function bestRunWithin(activeKeys: Set<string>): number {
  const sorted = [...activeKeys].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    if (prev !== null && isConsecutive(prev, key)) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}
