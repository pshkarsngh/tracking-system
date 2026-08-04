import { prisma } from "@/lib/db";
import type { SettingsData } from "./types";

export async function getSettingsData(userId: string): Promise<SettingsData> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      timezone: true,
      dailyGoalMinutes: true,
      weeklyGoalMinutes: true,
      darkMode: true,
      plan: true,
      xp: true,
      coins: true,
      level: true,
      currentStreak: true,
      bestStreak: true,
    },
  });

  return { user };
}
