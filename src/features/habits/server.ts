import { prisma } from "@/lib/db";
import { todayKey, lastNDays, toDateKey } from "@/lib/domain/dates";
import { computeStreak } from "@/lib/domain/streaks";
import type { HabitWithData, HabitsData } from "./types";
export type { HabitWithData, HabitsData } from "./types";

const STRIP_DAYS = 14;

export async function getHabitsData(userId: string): Promise<HabitsData> {
  const today = todayKey();
  const stripKeys = lastNDays(STRIP_DAYS);

  const [habits, logs] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        frequency: true,
        targetCount: true,
        unit: true,
        currentStreak: true,
        bestStreak: true,
        totalCompletions: true,
      },
    }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: new Date(`${stripKeys[0]}T00:00:00`) } },
      select: { habitId: true, date: true, count: true },
    }),
  ]);

  const logMap = new Map<string, { key: string; count: number }[]>();
  for (const l of logs) {
    const key = toDateKey(l.date);
    const arr = logMap.get(l.habitId) ?? [];
    arr.push({ key, count: l.count });
    logMap.set(l.habitId, arr);
  }

  const habitsWithData: HabitWithData[] = habits.map((h) => {
    const keys = (logMap.get(h.id) ?? []).map((x) => x.key);
    const keySet = new Set(keys);
    const byKey = new Map((logMap.get(h.id) ?? []).map((x) => [x.key, x.count] as const));

    const streak = computeStreak(keySet, today);
    const week = stripKeys.map((key) => ({
      key,
      done: keySet.has(key),
      count: byKey.get(key) ?? 0,
    }));

    return {
      ...h,
      currentStreak: Math.max(h.currentStreak, streak.current),
      bestStreak: Math.max(h.bestStreak, streak.best),
      doneToday: keySet.has(today),
      week,
    };
  });

  return {
    today,
    habits: habitsWithData,
    activeCount: habits.length,
    doneTodayCount: habitsWithData.filter((h) => h.doneToday).length,
  };
}
