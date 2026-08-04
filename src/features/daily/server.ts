import { prisma } from "@/lib/db";
import { todayKey, toDateKey } from "@/lib/domain/dates";
import type { DailyData } from "./types";
export type { DailySession, DailyData } from "./types";

export async function getDailyData(userId: string, dateKey?: string): Promise<DailyData> {
  const key = dateKey ?? todayKey();
  const dayStart = new Date(`${key}T00:00:00`);
  const dayEnd = new Date(`${key}T23:59:59.999`);
  const yesterdayKey = toDateKey(new Date(dayStart.getTime() - 86_400_000));
  const yesterdayStart = new Date(`${yesterdayKey}T00:00:00`);
  const yesterdayEnd = new Date(`${yesterdayKey}T23:59:59.999`);

  const [user, sessions, sessionsYesterday, topics] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { dailyGoalMinutes: true, name: true },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        trackerType: true,
        topicName: true,
        durationMin: true,
        xpEarned: true,
        startedAt: true,
        notes: true,
      },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      select: { durationMin: true },
    }),
    prisma.topic.findMany({
      where: { userId },
      select: { id: true, name: true, trackerType: true },
      orderBy: [{ trackerType: "asc" }, { name: "asc" }],
    }),
  ]);

  const focusMinutes = sessions.reduce((s, x) => s + x.durationMin, 0);
  const xpEarned = sessions.reduce((s, x) => s + x.xpEarned, 0);

  const topicsByTracker = new Map<string, { id: string; name: string }[]>();
  for (const t of topics) {
    const list = topicsByTracker.get(t.trackerType) ?? [];
    list.push({ id: t.id, name: t.name });
    topicsByTracker.set(t.trackerType, list);
  }

  return {
    dateKey: key,
    label: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dayStart),
    focusMinutes,
    xpEarned,
    sessionCount: sessions.length,
    goalMinutes: user.dailyGoalMinutes,
    yesterdayMinutes: sessionsYesterday.reduce((s, x) => s + x.durationMin, 0),
    sessions,
    topicsByTracker: [...topicsByTracker.entries()].map(([trackerType, topicList]) => ({
      trackerType,
      topics: topicList,
    })),
  };
}
