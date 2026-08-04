/**
 * Analytics scoring (spec §7). Pure functions.
 */

export interface ScoreInput {
  activeDays: number;
  totalDays: number;
  plannedMinutes: number;
  executedMinutes: number;
  xpEarned: number;
  xpTarget: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** % of days in the period with any tracked activity. */
export function consistencyScore(activeDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return clamp(Math.round((activeDays / totalDays) * 100));
}

/** Scheduled adherence: executed vs planned focus time. */
export function disciplineScore(plannedMinutes: number, executedMinutes: number): number {
  if (plannedMinutes <= 0) return 0;
  return clamp(Math.round((executedMinutes / plannedMinutes) * 100));
}

/** Weighted XP earned vs target. */
export function productivityScore(xpEarned: number, xpTarget: number): number {
  if (xpTarget <= 0) return 0;
  return clamp(Math.round((xpEarned / xpTarget) * 100));
}

export interface PlacementReadinessInput {
  dsa: number; // 0-100
  aptitude: number;
  communication: number;
  projects: number;
  resume: number;
  interview: number;
}

const PLACEMENT_WEIGHTS: Record<keyof PlacementReadinessInput, number> = {
  dsa: 0.3,
  aptitude: 0.15,
  communication: 0.15,
  projects: 0.15,
  resume: 0.1,
  interview: 0.15,
};

/** Composite placement readiness score. */
export function placementReadinessScore(input: PlacementReadinessInput): number {
  const entries = Object.entries(PLACEMENT_WEIGHTS) as [keyof PlacementReadinessInput, number][];
  const raw = entries.reduce((sum, [key, w]) => sum + clamp(input[key]) * w, 0);
  return Math.round(raw);
}

/** Grade label for a 0-100 score. */
export function gradeFor(score: number): { label: string; color: "emerald" | "amber" | "rose" | "sky" } {
  if (score >= 85) return { label: "Excellent", color: "emerald" };
  if (score >= 70) return { label: "Good", color: "sky" };
  if (score >= 50) return { label: "Fair", color: "amber" };
  return { label: "Needs work", color: "rose" };
}
