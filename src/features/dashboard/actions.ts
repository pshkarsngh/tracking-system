"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import { todayKey } from "@/lib/domain/dates";
import { XP_RULES } from "@/lib/domain/gamification";
import { awardXp } from "@/features/gamification/service";

export type ActionState = {
  ok?: boolean;
  error?: string;
  levelUp?: { level: number; title?: string };
};

/**
 * Toggle a habit for today. Completing awards XP + coins; un-completing
 * only removes the log (XP is not clawed back, keeping the ledger positive).
 */
export async function toggleHabitAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUserAction();
  const habitId = formData.get("habitId")?.toString();
  if (!habitId) return { error: "Missing habit id" };

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
    select: { id: true, name: true },
  });
  if (!habit) return { error: "Habit not found" };

  const today = todayKey();
  const date = new Date(`${today}T00:00:00`);

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_userId_date: { habitId, userId: user.id, date } },
    select: { id: true },
  });

  let levelUp: ActionState["levelUp"];

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.habitLog.delete({ where: { id: existing.id } });
    } else {
      await tx.habitLog.create({
        data: { habitId, userId: user.id, date, count: 1 },
      });
      const award = await awardXp({
        userId: user.id,
        xp: XP_RULES.HABIT_COMPLETE,
        source: "HABIT",
        sourceId: habitId,
        note: `Completed habit: ${habit.name}`,
        tx,
      });
      if (award.leveledUp) {
        levelUp = { level: award.level };
      }
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/habits");
  return { ok: true, levelUp };
}
