import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import { XP_RULES } from "@/lib/domain/gamification";
import { awardXp } from "@/features/gamification/service";
import type { ActionState } from "@/lib/server/action";
import type { Prisma } from "@/generated/prisma/client";
import type { TrackerType } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

function parseMilestones(raw: FormDataEntryValue | null): Milestone[] {
  if (!raw) return [];
  return String(raw)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({ id: randomUUID(), title, done: false }));
}

function progressFor(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  return Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100);
}

function readGoalForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    category: (String(formData.get("category") ?? "") || null) as string | null,
    priority: (String(formData.get("priority") ?? "MEDIUM") || "MEDIUM") as string,
    targetDate: (String(formData.get("targetDate") ?? "") || null) as string | null,
  };
}

const revalidate = () => revalidatePath("/goals");

export async function createGoalAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const { title, description, category, priority, targetDate } = readGoalForm(formData);
  if (!title) return { error: "Title is required." };

  const milestones = parseMilestones(formData.get("milestones"));

  await prisma.goal.create({
    data: {
      userId: user.id,
      title,
      description,
      category: (category ?? undefined) as TrackerType | undefined,
      priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      targetDate: targetDate ? new Date(`${targetDate}T00:00:00`) : null,
      milestones: milestones as unknown as Prisma.InputJsonValue,
      progress: progressFor(milestones),
    },
  });
  revalidate();
  return { ok: true };
}

export async function updateGoalAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const id = String(formData.get("id") ?? "");
  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) return { error: "Goal not found." };

  const { title, description, category, priority, targetDate } = readGoalForm(formData);
  if (!title) return { error: "Title is required." };

  const existing = goal.milestones as unknown as Milestone[];
  await prisma.goal.update({
    where: { id },
    data: {
      title,
      description,
      category: (category ?? null) as TrackerType | null,
      priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      targetDate: targetDate ? new Date(`${targetDate}T00:00:00`) : null,
      progress: progressFor(existing),
    },
  });
  revalidate();
  return { ok: true };
}

export async function toggleMilestoneAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const id = String(formData.get("id") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) return { error: "Goal not found." };

  const milestones = goal.milestones as unknown as Milestone[];
  const milestone = milestones.find((m) => m.id === milestoneId);
  if (!milestone) return { error: "Milestone not found." };

  const becameDone = !milestone.done;
  const updated = milestones.map((m) => (m.id === milestoneId ? { ...m, done: becameDone } : m));
  const progress = progressFor(updated);

  let levelUp: ActionState["levelUp"];

  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: { id },
      data: { milestones: updated as unknown as Prisma.InputJsonValue, progress },
    });
    if (becameDone) {
      const award = await awardXp({
        userId: user.id,
        xp: XP_RULES.GOAL_MILESTONE,
        source: "GOAL_MILESTONE",
        sourceId: goal.id,
        note: `Milestone: ${milestone.title}`,
        tx,
      });
      if (award.leveledUp) levelUp = { level: award.level };
    }
  });

  revalidate();
  return levelUp ? { ok: true, levelUp } : { ok: true };
}

export async function completeGoalAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = String(formData.get("id") ?? "");
  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) return;

  const milestones = goal.milestones as unknown as Milestone[];
  await prisma.goal.update({
    where: { id },
    data: {
      status: "COMPLETED",
      progress: 100,
      milestones: (milestones.map((m) => ({ ...m, done: true })) as unknown as Prisma.InputJsonValue),
    },
  });
  revalidate();
}

export async function archiveGoalAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = String(formData.get("id") ?? "");
  await prisma.goal.updateMany({ where: { id, userId: user.id }, data: { status: "ARCHIVED" } });
  revalidate();
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = String(formData.get("id") ?? "");
  await prisma.goal.deleteMany({ where: { id, userId: user.id } });
  revalidate();
}
