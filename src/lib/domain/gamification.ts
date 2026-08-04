import type { Difficulty } from "@/generated/prisma/enums";

/**
 * Gamification rules (spec §6).
 * Pure functions — no I/O. XP is denormalized on User and audited in XpTransaction.
 */

export const XP_RULES = {
  STUDY_MINUTE: 1, // 1 XP per focused minute
  HABIT_COMPLETE: 10,
  PROBLEM: { EASY: 30, MEDIUM: 60, HARD: 100 },
  GOAL_MILESTONE: 150,
  MOCK_INTERVIEW: 150,
  SPEAKING_MINUTE: 2,
  CHALLENGE: 200,
} as const;

export const COINS_PER_XP = 0.1;

/** Cumulative XP required to reach level n (100, 300, 600, 1000, …). */
export function xpRequiredForLevel(level: number): number {
  return 100 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2));
}

export function xpIntoLevel(xp: number): number {
  const level = levelFromXp(xp);
  const base = xpRequiredForLevel(level);
  return xp - base;
}

export function xpForLevelUp(level: number): number {
  return xpRequiredForLevel(level + 1) - xpRequiredForLevel(level);
}

export function coinsForXp(xp: number): number {
  return Math.floor(xp * COINS_PER_XP);
}

export function xpForProblem(difficulty: Difficulty): number {
  return XP_RULES.PROBLEM[difficulty];
}

export function xpForStudyMinutes(minutes: number): number {
  return minutes * XP_RULES.STUDY_MINUTE;
}

/** Level progress 0..1 toward the next level. */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  const into = xpIntoLevel(xp);
  const span = xpForLevelUp(level);
  return span === 0 ? 0 : Math.min(1, into / span);
}

/** Human title for a level bracket. */
export function levelTitle(level: number): string {
  if (level >= 50) return "Grandmaster";
  if (level >= 30) return "Master";
  if (level >= 20) return "Expert";
  if (level >= 12) return "Achiever";
  if (level >= 7) return "Scholar";
  if (level >= 3) return "Rising Star";
  return "Beginner";
}
