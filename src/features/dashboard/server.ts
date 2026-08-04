import { prisma } from "@/lib/db";
import {
  todayKey,
  lastNDays,
  toDateKey,
  dateKeyRange,
  startOfWeekKey,
  addDaysToKey,
} from "@/lib/domain/dates";
import { computeStreak } from "@/lib/domain/streaks";
import { levelFromXp, levelProgress, levelTitle } from "@/lib/domain/gamification";
import {
  consistencyScore,
  disciplineScore,
  productivityScore,
} from "@/lib/domain/scores";

/**
 * Aggregate daily activity levels 0..4 for the contribution heatmap.
 * Activity points ≈ XP: 1/min focus, 10/habit, 30/problem.
 */
export function activityLevel(points: number): 0 | 1 | 2 | 3 | 4 {
  if (points <= 0) return 0;
  if (points < 30) return 1;
  if (points < 80) return 2;
  if (points < 160) return 3;
  return 4;
}

export interface DashboardData {
  user: {
    name: string;
    xp: number;
    coins: number;
    level: number;
    levelTitle: string;
    levelProgress: number;
    currentStreak: number;
    bestStreak: number;
    dailyGoalMinutes: number;
    weeklyGoalMinutes: number;
  };
  today: {
    dateKey: string;
    label: string;
    focusMinutes: number;
    plannedMinutes: number;
    xpEarned: number;
    habitsDone: number;
    habitsTotal: number;
  };
  week: {
    focusMinutes: number;
    plannedMinutes: number;
    activeDays: number;
    consistency: number;
    discipline: number;
    productivity: number;
  };
  heatmap: Map<string, 0 | 1 | 2 | 3 | 4>;
  charts: {
    xpByDay: { key: string; xp: number }[];
    minutesByTracker: { tracker: string; minutes: number }[];
  };
  habits: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    trackerType: string | null;
    doneToday: boolean;
  }[];
  problems: {
    total: number;
    solved: number;
    today: number;
    byDifficulty: { difficulty: string; solved: number }[];
  };
  applications: { status: string; count: number }[];
  upcoming: {
    collegeTasks: { id: string; title: string; type: string; dueDate: Date | null; status: string }[];
    interviews: { id: string; title: string; date: Date }[];
    goalDeadlines: { id: string; title: string; targetDate: Date | null; progress: number }[];
  };
  recentActivity: {
    id: string;
    type: string;
    label: string;
    sublabel: string;
    at: Date;
  }[];
}

export async function getDashboardData(userId: string, tz?: string): Promise<DashboardData> {
  const today = todayKey(tz);
  const weekStart = startOfWeekKey(today);
  const thirtyDays = lastNDays(30);
  const dayStart = new Date(`${today}T00:00:00`);
  const dayEnd = new Date(`${today}T23:59:59.999`);

  const [
    user,
    sessions30,
    sessionsToday,
    sessionsWeek,
    habits,
    habitLogs30,
    problems,
    problemsToday,
    problemAttempts,
    applications,
    collegeTasks,
    interviews,
    goals,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: new Date(`${thirtyDays[0]}T00:00:00`) } },
      select: { startedAt: true, durationMin: true, xpEarned: true, trackerType: true },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: dayStart, lte: dayEnd } },
      select: { durationMin: true, xpEarned: true },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: new Date(`${weekStart}T00:00:00`), lte: dayEnd } },
      select: { startedAt: true, durationMin: true },
    }),
    prisma.habit.findMany({
      where: { userId, active: true },
      select: { id: true, name: true, icon: true, color: true, trackerType: true },
    }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: new Date(`${thirtyDays[0]}T00:00:00`) } },
      select: { date: true, habitId: true },
    }),
    prisma.problem.findMany({
      where: { userId },
      select: { status: true, difficulty: true },
    }),
    prisma.problem.findMany({
      where: { userId, status: "SOLVED", solvedAt: { gte: dayStart, lte: dayEnd } },
      select: { id: true },
    }),
    prisma.problemAttempt.findMany({
      where: { userId, date: { gte: new Date(`${thirtyDays[0]}T00:00:00`) } },
      select: { date: true },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.collegeTask.findMany({
      where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, type: true, dueDate: true, status: true },
    }),
    prisma.mockInterview.findMany({
      where: { userId, date: { gte: dayStart } },
      orderBy: { date: "asc" },
      take: 4,
      select: { id: true, type: true, date: true },
    }),
    prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { targetDate: "asc" },
      take: 4,
      select: { id: true, title: true, targetDate: true, progress: true },
    }),
  ]);

  // ── Today stats ──
  const focusToday = sessionsToday.reduce((s, x) => s + x.durationMin, 0);
  const xpToday = sessionsToday.reduce((s, x) => s + x.xpEarned, 0);

  // ── XP by day (30d) ──
  const xpByDayMap = new Map<string, number>();
  for (const s of sessions30) {
    const key = toDateKey(s.startedAt, tz);
    xpByDayMap.set(key, (xpByDayMap.get(key) ?? 0) + s.xpEarned);
  }
  const xpByDay = thirtyDays.map((key) => ({ key, xp: xpByDayMap.get(key) ?? 0 }));

  // ── Minutes by tracker (30d) ──
  const minutesByTrackerMap = new Map<string, number>();
  for (const s of sessions30) {
    minutesByTrackerMap.set(s.trackerType, (minutesByTrackerMap.get(s.trackerType) ?? 0) + s.durationMin);
  }
  const minutesByTracker = [...minutesByTrackerMap.entries()]
    .map(([tracker, minutes]) => ({ tracker, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  // ── Heatmap (26 weeks) ──
  const heatmapDays = dateKeyRange(addDaysToKey(today, -(26 * 7) + 1), today);
  const sessionPoints = new Map<string, number>();
  for (const s of sessions30) {
    const key = toDateKey(s.startedAt, tz);
    sessionPoints.set(key, (sessionPoints.get(key) ?? 0) + s.durationMin);
  }
  for (const l of habitLogs30) {
    const key = toDateKey(l.date, tz);
    sessionPoints.set(key, (sessionPoints.get(key) ?? 0) + 10);
  }
  for (const a of problemAttempts) {
    const key = toDateKey(a.date, tz);
    sessionPoints.set(key, (sessionPoints.get(key) ?? 0) + 30);
  }
  const heatmap = new Map<string, 0 | 1 | 2 | 3 | 4>();
  for (const key of heatmapDays) {
    heatmap.set(key, activityLevel(sessionPoints.get(key) ?? 0));
  }

  // ── Habit checklist ──
  const todayHabitLogs = new Set(
    habitLogs30.filter((l) => toDateKey(l.date, tz) === today).map((l) => l.habitId)
  );
  const habitChecklist = habits.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color,
    trackerType: h.trackerType,
    doneToday: todayHabitLogs.has(h.id),
  }));

  // ── Week stats ──
  const focusWeek = sessionsWeek.reduce((s, x) => s + x.durationMin, 0);
  const activeDayKeys = new Set(sessionsWeek.map((s) => toDateKey(s.startedAt, tz)));
  const activeDaysInWeek = activeDayKeys.size;
  const weeklyPlanned = user.weeklyGoalMinutes;
  const weekActiveAll = [...new Set(sessions30.map((s) => toDateKey(s.startedAt, tz)))];
  const streak = computeStreak(new Set(weekActiveAll), today);

  const xp30Total = sessions30.reduce((s, x) => s + x.xpEarned, 0);

  // ── Recent activity ──
  type Activity = { id: string; type: string; label: string; sublabel: string; at: Date };
  const recent: Activity[] = [];
  const recentSessions = await prisma.studySession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 4,
    select: { id: true, startedAt: true, durationMin: true, trackerType: true, topicName: true },
  });
  for (const s of recentSessions) {
    recent.push({
      id: s.id,
      type: "session",
      label: `${s.topicName}`,
      sublabel: `${s.durationMin} min · ${s.trackerType}`,
      at: s.startedAt,
    });
  }
  const recentProblems = await prisma.problem.findMany({
    where: { userId, status: "SOLVED" },
    orderBy: { solvedAt: "desc" },
    take: 3,
    select: { id: true, title: true, difficulty: true, solvedAt: true },
  });
  for (const p of recentProblems) {
    recent.push({
      id: p.id,
      type: "problem",
      label: `Solved "${p.title}"`,
      sublabel: p.difficulty,
      at: p.solvedAt ?? new Date(),
    });
  }
  const recentBadges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    take: 2,
    select: { id: true, earnedAt: true, badge: { select: { name: true } } },
  });
  for (const b of recentBadges) {
    recent.push({
      id: b.id,
      type: "badge",
      label: `Earned badge "${b.badge.name}"`,
      sublabel: "Achievement",
      at: b.earnedAt,
    });
  }
  recent.sort((a, b) => b.at.getTime() - a.at.getTime());

  // ── Problems summary ──
  const solvedByDifficulty = problems
    .filter((p) => p.status === "SOLVED")
    .reduce((acc, p) => {
      acc[p.difficulty] = (acc[p.difficulty] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const appStatusMap = new Map<string, number>();
  for (const a of applications) appStatusMap.set(a.status, a._count._all);

  const level = levelFromXp(user.xp);

  return {
    user: {
      name: user.name,
      xp: user.xp,
      coins: user.coins,
      level,
      levelTitle: levelTitle(level),
      levelProgress: levelProgress(user.xp),
      currentStreak: streak.current,
      bestStreak: Math.max(user.bestStreak, streak.best),
      dailyGoalMinutes: user.dailyGoalMinutes,
      weeklyGoalMinutes: user.weeklyGoalMinutes,
    },
    today: {
      dateKey: today,
      label: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
      focusMinutes: focusToday,
      plannedMinutes: user.dailyGoalMinutes,
      xpEarned: xpToday,
      habitsDone: habitChecklist.filter((h) => h.doneToday).length,
      habitsTotal: habitChecklist.length,
    },
    week: {
      focusMinutes: focusWeek,
      plannedMinutes: weeklyPlanned,
      activeDays: activeDaysInWeek,
      consistency: consistencyScore(activeDaysInWeek, 7),
      discipline: disciplineScore(weeklyPlanned, focusWeek),
      productivity: productivityScore(xp30Total, user.dailyGoalMinutes * 30),
    },
    heatmap,
    charts: { xpByDay, minutesByTracker },
    habits: habitChecklist,
    problems: {
      total: problems.length,
      solved: problems.filter((p) => p.status === "SOLVED").length,
      today: problemsToday.length,
      byDifficulty: Object.entries(solvedByDifficulty).map(([difficulty, solved]) => ({
        difficulty,
        solved,
      })),
    },
    applications: [...appStatusMap.entries()].map(([status, count]) => ({ status, count })),
    upcoming: {
      collegeTasks,
      interviews: interviews.map((i) => ({ ...i, title: i.type })),
      goalDeadlines: goals,
    },
    recentActivity: recent,
  };
}

export type HabitQuickToggleTarget = { habitId: string; date: string };
