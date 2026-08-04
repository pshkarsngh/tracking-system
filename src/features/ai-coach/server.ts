import { prisma } from "@/lib/db";
import { todayKey } from "@/lib/domain/dates";
import type { CoachData } from "./types";

export type { CoachData } from "./types";

export async function getCoachData(userId: string): Promise<CoachData> {
  const today = todayKey();
  const dayStart = new Date(`${today}T00:00:00`);
  const dayEnd = new Date(`${today}T23:59:59.999`);

  const [aiPrompts, sessionsToday, problemsToday, habitLogsToday, user] = await Promise.all([
    prisma.aIPrompt.findMany({
      where: { userId, kind: "COACH" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        kind: true,
        prompt: true,
        response: true,
        model: true,
        createdAt: true,
      },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: dayStart, lte: dayEnd } },
      select: { durationMin: true },
    }),
    prisma.problem.findMany({
      where: { userId, status: "SOLVED", solvedAt: { gte: dayStart, lte: dayEnd } },
      select: { id: true },
    }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
      select: { id: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { currentStreak: true },
    }),
  ]);

  const focusMinutes = sessionsToday.reduce((sum, s) => sum + s.durationMin, 0);

  return {
    history: aiPrompts,
    recentActivity: {
      focusMinutes,
      problemsSolved: problemsToday.length,
      habitsDone: habitLogsToday.length,
      streak: user.currentStreak,
    },
  };
}
