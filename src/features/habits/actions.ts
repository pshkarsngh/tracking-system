"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import type { ActionState } from "@/lib/server/action";
import { todayKey } from "@/lib/domain/dates";
import { XP_RULES } from "@/lib/domain/gamification";
import { awardXp } from "@/features/gamification/service";

const habitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  frequency: z.enum(["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"]).default("DAILY"),
  targetCount: z.coerce.number().int().min(1).max(100).default(1),
  unit: z.string().trim().max(30).optional().or(z.literal("")),
  trackerType: z
    .enum(["DSA", "WEB_DEV", "AI_ML", "ENGLISH", "APTITUDE", "COLLEGE", "PROJECT"])
    .optional()
    .or(z.literal("")),
});

export async function createHabitAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();

  const parsed = habitSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color") ?? "#6366f1",
    icon: formData.get("icon"),
    frequency: formData.get("frequency") ?? "DAILY",
    targetCount: formData.get("targetCount") ?? 1,
    unit: formData.get("unit"),
    trackerType: formData.get("trackerType"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid habit" };
  const { name, description, color, icon, frequency, targetCount, unit, trackerType } = parsed.data;

  await prisma.habit.create({
    data: {
      userId: user.id,
      name,
      description: description || null,
      color,
      icon: icon || null,
      frequency,
      targetCount,
      unit: unit || null,
      trackerType: trackerType || null,
    },
  });

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteHabitAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const habit = await prisma.habit.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!habit) return;

  await prisma.habit.delete({ where: { id } });
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

/** Toggle a habit for a given date (defaults to today). Awards XP on completion. */
export async function toggleHabitForDateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const habitId = formData.get("habitId")?.toString();
  const dateKey = formData.get("date")?.toString() || todayKey();
  if (!habitId) return { error: "Missing habit id" };

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
    select: { id: true, name: true },
  });
  if (!habit) return { error: "Habit not found" };

  const date = new Date(`${dateKey}T00:00:00`);
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_userId_date: { habitId, userId: user.id, date } },
    select: { id: true },
  });

  let levelUp: ActionState["levelUp"];
  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.habitLog.delete({ where: { id: existing.id } });
    } else {
      await tx.habitLog.create({ data: { habitId, userId: user.id, date, count: 1 } });
      const award = await awardXp({
        userId: user.id,
        xp: XP_RULES.HABIT_COMPLETE,
        source: "HABIT",
        sourceId: habitId,
        note: `Completed habit: ${habit.name}`,
        tx,
      });
      if (award.leveledUp) levelUp = { level: award.level };
    }
  });

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  return { ok: true, levelUp };
}
