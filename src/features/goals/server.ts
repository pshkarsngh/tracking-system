import { prisma } from "@/lib/db";
import { todayKey } from "@/lib/domain/dates";
import type { GoalDTO } from "./types";

export type { GoalDTO };
export { GOAL_CATEGORY_LABEL, PRIORITY_META } from "./types";

export interface GoalsData {
  active: GoalDTO[];
  done: GoalDTO[];
  stats: {
    total: number;
    completed: number;
    active: number;
    avgProgress: number;
    xpFromGoals: number;
  };
}

export async function getGoalsData(userId: string): Promise<GoalsData> {
  const [goals, xpAgg] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { targetDate: "asc" }],
    }),
    prisma.xpTransaction.aggregate({
      where: { userId, source: "GOAL_MILESTONE" },
      _sum: { xp: true },
    }),
  ]);

  const today = todayKey();

  const decorate = (g: (typeof goals)[number]): GoalDTO => {
    const targetKey = g.targetDate ? g.targetDate.toISOString().slice(0, 10) : null;
    return {
      ...g,
      milestones: (g.milestones as unknown as { id: string; title: string; done: boolean }[]) ?? [],
      dueInDays: targetKey ? Math.ceil((g.targetDate!.getTime() - Date.now()) / 86_400_000) : null,
      overdue: g.status === "ACTIVE" && targetKey !== null && today > targetKey,
    };
  };

  const active = goals
    .filter((g) => g.status === "ACTIVE")
    .map(decorate);
  const done = goals
    .filter((g) => g.status === "COMPLETED" || g.status === "ARCHIVED")
    .map(decorate);

  const activeGoals = active.filter((g) => g.status === "ACTIVE");
  const completedCount = goals.filter((g) => g.status === "COMPLETED").length;

  return {
    active,
    done,
    stats: {
      total: goals.length,
      completed: completedCount,
      active: activeGoals.length,
      avgProgress: activeGoals.length ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length) : 0,
      xpFromGoals: xpAgg._sum.xp ?? 0,
    },
  };
}
