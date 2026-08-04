"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import type { ActionState } from "@/lib/server/action";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid name" };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/settings");
  return { ok: true };
}

const updateGoalsSchema = z.object({
  dailyGoalMinutes: z.coerce.number().int().min(30).max(480),
  weeklyGoalMinutes: z.coerce.number().int().min(210).max(3360),
});

export async function updateGoalsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = updateGoalsSchema.safeParse({
    dailyGoalMinutes: formData.get("dailyGoalMinutes"),
    weeklyGoalMinutes: formData.get("weeklyGoalMinutes"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid goals" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      dailyGoalMinutes: parsed.data.dailyGoalMinutes,
      weeklyGoalMinutes: parsed.data.weeklyGoalMinutes,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

const updatePreferencesSchema = z.object({
  timezone: z.string().min(1).max(50),
  darkMode: z.boolean(),
});

export async function updatePreferencesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = updatePreferencesSchema.safeParse({
    timezone: formData.get("timezone"),
    darkMode: formData.get("darkMode") === "on",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid preferences" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      timezone: parsed.data.timezone,
      darkMode: parsed.data.darkMode,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUserAction();
  const confirm = formData.get("confirm")?.toString();

  if (confirm !== "DELETE") {
    return { error: 'Type DELETE to confirm account deletion' };
  }

  await prisma.user.delete({ where: { id: user.id } });

  revalidatePath("/settings");
  return { ok: true };
}
