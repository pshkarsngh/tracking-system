import { prisma } from "@/lib/db";
import { todayKey, toDateKey, lastNDays, startOfWeekKey, addDaysToKey } from "@/lib/domain/dates";
import { placementReadinessScore } from "@/lib/domain/scores";

export interface WeeklyRow {
  weekKey: string;
  label: string;
  focusMinutes: number;
  xp: number;
  habitsDone: number;
  problemsSolved: number;
}

export interface AnalyticsData {
  totals: {
    focusMinutes: number;
    xp: number;
    problemsSolved: number;
    habitsDone: number;
    sessions: number;
    interviews: number;
    speakingMinutes: number;
  };
  xpByDay: { key: string; xp: number }[];
  minutesByTracker: { tracker: string; minutes: number }[];
  xpBySource: { source: string; xp: number; count: number }[];
  problemsByDifficulty: { difficulty: string; solved: number }[];
  problemsByStatus: { status: string; count: number }[];
  applicationsByStatus: { status: string; count: number }[];
  weekly: WeeklyRow[];
  readiness: { dsa: number; aptitude: number; communication: number; projects: number; resume: number; interview: number; score: number };
  activeDays: number;
  bestDayXp: { key: string; xp: number };
}

export const XP_SOURCE_LABEL: Record<string, string> = {
  STUDY_SESSION: "Focus",
  HABIT: "Habits",
  PROBLEM: "Problems",
  SPEAKING: "Speaking",
  MOCK_INTERVIEW: "Mock interviews",
  GOAL_MILESTONE: "Goal milestones",
  CHALLENGE: "Challenges",
};

export async function getAnalyticsData(userId: string, tz?: string): Promise<AnalyticsData> {
  const today = todayKey(tz);
  const thirtyDays = lastNDays(30);
  const periodStart = new Date(`${thirtyDays[0]}T00:00:00`);

  const [
    sessions,
    xpTxns,
    problems,
    problemsSolvedPeriod,
    habitLogs,
    interviews,
    speaking,
    applications,
  ] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: periodStart } },
      select: { startedAt: true, durationMin: true, xpEarned: true, trackerType: true },
    }),
    prisma.xpTransaction.findMany({
      where: { userId, type: "EARN", createdAt: { gte: periodStart } },
      select: { source: true, xp: true, createdAt: true },
    }),
    prisma.problem.findMany({
      where: { userId },
      select: { status: true, difficulty: true },
    }),
    prisma.problem.findMany({
      where: { userId, status: "SOLVED", solvedAt: { gte: periodStart } },
      select: { id: true },
    }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: periodStart } },
      select: { date: true },
    }),
    prisma.mockInterview.findMany({
      where: { userId, date: { gte: periodStart } },
      select: { durationMin: true },
    }),
    prisma.speakingLog.findMany({
      where: { userId, date: { gte: periodStart } },
      select: { durationMin: true },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  // ── XP by day ──
  const xpByDayMap = new Map<string, number>();
  for (const t of xpTxns) {
    const key = toDateKey(t.createdAt, tz);
    xpByDayMap.set(key, (xpByDayMap.get(key) ?? 0) + t.xp);
  }
  const xpByDay = thirtyDays.map((key) => ({ key, xp: xpByDayMap.get(key) ?? 0 }));

  // ── XP by source ──
  const xpSourceMap = new Map<string, { xp: number; count: number }>();
  for (const t of xpTxns) {
    const cur = xpSourceMap.get(t.source) ?? { xp: 0, count: 0 };
    xpSourceMap.set(t.source, { xp: cur.xp + t.xp, count: cur.count + 1 });
  }
  const xpBySource = [...xpSourceMap.entries()]
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.xp - a.xp);

  // ── Minutes by tracker ──
  const minutesByTrackerMap = new Map<string, number>();
  for (const s of sessions) {
    minutesByTrackerMap.set(s.trackerType, (minutesByTrackerMap.get(s.trackerType) ?? 0) + s.durationMin);
  }
  const minutesByTracker = [...minutesByTrackerMap.entries()]
    .map(([tracker, minutes]) => ({ tracker, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  // ── Problems ──
  const solvedByDifficulty = problems
    .filter((p) => p.status === "SOLVED")
    .reduce((acc, p) => {
      acc[p.difficulty] = (acc[p.difficulty] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const problemsByStatus = problems.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ── Weekly rows (last 8 weeks ending this week) ──
  const weekStart = startOfWeekKey(today);
  const weeks = Array.from({ length: 8 }, (_, i) => addDaysToKey(weekStart, -(7 * (7 - i))));
  const weekly: WeeklyRow[] = weeks.map((wk) => {
    const ws = new Date(`${wk}T00:00:00`);
    const we = new Date(`${addDaysToKey(wk, 6)}T23:59:59.999`);
    const weekSessions = sessions.filter((s) => s.startedAt >= ws && s.startedAt <= we);
    const weekTxns = xpTxns.filter((t) => t.createdAt >= ws && t.createdAt <= we);
    const weekHabits = habitLogs.filter((h) => h.date >= ws && h.date <= we);
    return {
      weekKey: wk,
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(ws),
      focusMinutes: weekSessions.reduce((s, x) => s + x.durationMin, 0),
      xp: weekTxns.reduce((s, x) => s + x.xp, 0),
      habitsDone: new Set(weekHabits.map((h) => toDateKey(h.date, tz))).size,
      problemsSolved: 0,
    };
  });

  // weekly solved problems, computed in a second pass from full problem records
  const solvedWithDate = await prisma.problem.findMany({
    where: { userId, status: "SOLVED", solvedAt: { gte: periodStart } },
    select: { solvedAt: true },
  });
  for (const row of weekly) {
    const ws = new Date(`${row.weekKey}T00:00:00`);
    const we = new Date(`${addDaysToKey(row.weekKey, 6)}T23:59:59.999`);
    row.problemsSolved = solvedWithDate.filter((p) => p.solvedAt && p.solvedAt >= ws && p.solvedAt <= we).length;
  }

  // ── Totals & highlights ──
  const focusMinutes = sessions.reduce((s, x) => s + x.durationMin, 0);
  const xp = xpTxns.reduce((s, x) => s + x.xp, 0);
  const habitsDone = new Set(habitLogs.map((h) => toDateKey(h.date, tz))).size;
  const activeDays = new Set([
    ...sessions.map((s) => toDateKey(s.startedAt, tz)),
    ...habitLogs.map((h) => toDateKey(h.date, tz)),
  ]).size;
  const bestDayXp = xpByDay.reduce((best, cur) => (cur.xp > best.xp ? cur : best), { key: "", xp: 0 });

  // ── Readiness snapshot ──
  const readinessInputs = await getReadinessInputs(userId);

  return {
    totals: {
      focusMinutes,
      xp,
      problemsSolved: problemsSolvedPeriod.length,
      habitsDone,
      sessions: sessions.length,
      interviews: interviews.length,
      speakingMinutes: speaking.reduce((s, x) => s + (x.durationMin ?? 0), 0),
    },
    xpByDay,
    minutesByTracker,
    xpBySource,
    problemsByDifficulty: Object.entries(solvedByDifficulty).map(([difficulty, solved]) => ({ difficulty, solved })),
    problemsByStatus: Object.entries(problemsByStatus).map(([status, count]) => ({ status, count })),
    applicationsByStatus: applications.map((a) => ({ status: a.status, count: a._count._all })),
    weekly,
    readiness: { ...readinessInputs, score: placementReadinessScore(readinessInputs) },
    activeDays,
    bestDayXp,
  };
}

async function getReadinessInputs(userId: string) {
  const [problems, aptitude, speaking, projects, interviews] = await Promise.all([
    prisma.problem.findMany({ where: { userId }, select: { status: true } }),
    prisma.aptitudeAttempt.findMany({ where: { userId }, select: { correct: true, questions: true } }),
    prisma.speakingLog.findMany({ where: { userId }, select: { fluency: true, confidence: true } }),
    prisma.project.findMany({ where: { userId, featured: true }, select: { progress: true, status: true } }),
    prisma.mockInterview.findMany({ where: { userId }, select: { selfRating: true } }),
  ]);

  const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const total = problems.length;
  const solved = problems.filter((p) => p.status === "SOLVED").length;
  const dsa = total > 0 ? clampPct((solved / total) * 100) : 0;

  const aptitudeSum = aptitude.reduce((s, a) => s + (a.questions > 0 ? (a.correct / a.questions) * 100 : 0), 0);
  const aptitudeScore = aptitude.length > 0 ? clampPct(aptitudeSum / aptitude.length) : 0;

  const ratings = speaking.flatMap((s) => [s.fluency, s.confidence]).filter((v): v is number => v !== null);
  const communication = ratings.length > 0 ? clampPct((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) : 0;

  const projectsScore =
    projects.length > 0
      ? clampPct(projects.reduce((s, p) => s + (p.status === "DONE" ? 100 : p.progress), 0) / projects.length)
      : 0;

  const resume = clampPct(projects.length * 25);
  const interview = interviews.length > 0 ? clampPct(Math.min(100, interviews.length * 20 + 20)) : 0;

  return { dsa, aptitude: aptitudeScore, communication, projects: projectsScore, resume, interview };
}
