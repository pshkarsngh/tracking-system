"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import type { ActionState } from "@/lib/server/action";
import { XP_RULES } from "@/lib/domain/gamification";
import { awardXp } from "@/features/gamification/service";

const TRACKER_VALUES = ["DSA", "WEB_DEV", "AI_ML", "ENGLISH", "APTITUDE", "COLLEGE", "PROJECT"] as const;

const sessionSchema = z.object({
  trackerType: z.enum(TRACKER_VALUES),
  topicName: z.string().trim().min(1).max(120),
  durationMin: z.coerce.number().int().min(1).max(720),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  startedAt: z.string().optional().or(z.literal("")),
});

/**
 * Log a completed study/focus session. XP = 1 per focused minute (spec §6).
 */
export async function logSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();

  const parsed = sessionSchema.safeParse({
    trackerType: formData.get("trackerType"),
    topicName: formData.get("topicName"),
    durationMin: formData.get("durationMin"),
    notes: formData.get("notes"),
    startedAt: formData.get("startedAt"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid session" };
  const { trackerType, topicName, durationMin, notes, startedAt } = parsed.data;

  const started = startedAt ? new Date(startedAt) : new Date(Date.now() - durationMin * 60_000);
  const xp = durationMin * XP_RULES.STUDY_MINUTE;

  let levelUp: ActionState["levelUp"];
  await prisma.$transaction(async (tx) => {
    await tx.studySession.create({
      data: {
        userId: user.id,
        trackerType,
        topicName,
        durationMin,
        notes: notes || null,
        startedAt: started,
        xpEarned: xp,
      },
    });
    const award = await awardXp({
      userId: user.id,
      xp,
      source: "STUDY_SESSION",
      note: `${durationMin} min on ${topicName}`,
      tx,
    });
    if (award.leveledUp) levelUp = { level: award.level };
  });

  revalidatePath("/daily");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  return { ok: true, levelUp };
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const session = await prisma.studySession.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!session) return;

  await prisma.studySession.delete({ where: { id } });
  revalidatePath("/daily");
  revalidatePath("/dashboard");
}
