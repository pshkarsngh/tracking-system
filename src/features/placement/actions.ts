"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import type { ActionState } from "@/lib/server/action";
import { XP_RULES } from "@/lib/domain/gamification";
import { awardXp } from "@/features/gamification/service";

const APPLICATION_STATUSES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"] as const;
const INTERVIEW_TYPES = ["TECHNICAL", "DSA", "SYSTEM_DESIGN", "HR", "BEHAVIORAL", "CODING"] as const;

const applicationSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  url: z.string().trim().max(500).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  salary: z.string().trim().max(60).optional().or(z.literal("")),
  status: z.enum(APPLICATION_STATUSES).default("APPLIED"),
  appliedAt: z.string().optional().or(z.literal("")),
  nextRoundAt: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = applicationSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
    url: formData.get("url"),
    location: formData.get("location"),
    salary: formData.get("salary"),
    status: formData.get("status") ?? "APPLIED",
    appliedAt: formData.get("appliedAt"),
    nextRoundAt: formData.get("nextRoundAt"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid application" };
  const { company, role, url, location, salary, status, appliedAt, nextRoundAt, notes } = parsed.data;

  await prisma.application.create({
    data: {
      userId: user.id,
      company,
      role,
      url: url || null,
      location: location || null,
      salary: salary || null,
      status,
      appliedAt: appliedAt ? new Date(`${appliedAt}T00:00:00`) : new Date(),
      nextRoundAt: nextRoundAt ? new Date(nextRoundAt) : null,
      notes: notes || null,
    },
  });

  revalidatePath("/placement");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return { error: "Missing application id" };

  const parsed = applicationSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
    url: formData.get("url"),
    location: formData.get("location"),
    salary: formData.get("salary"),
    status: formData.get("status") ?? "APPLIED",
    appliedAt: formData.get("appliedAt"),
    nextRoundAt: formData.get("nextRoundAt"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid application" };
  const { company, role, url, location, salary, status, appliedAt, nextRoundAt, notes } = parsed.data;

  const app = await prisma.application.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!app) return { error: "Application not found" };

  await prisma.application.update({
    where: { id },
    data: {
      company,
      role,
      url: url || null,
      location: location || null,
      salary: salary || null,
      status,
      appliedAt: appliedAt ? new Date(`${appliedAt}T00:00:00`) : new Date(),
      nextRoundAt: nextRoundAt ? new Date(nextRoundAt) : null,
      notes: notes || null,
      lastUpdated: new Date(),
    },
  });

  revalidatePath("/placement");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setApplicationStatusAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status || !APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) return;

  const app = await prisma.application.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!app) return;

  await prisma.application.update({ where: { id }, data: { status: status as (typeof APPLICATION_STATUSES)[number], lastUpdated: new Date() } });
  revalidatePath("/placement");
  revalidatePath("/dashboard");
}

/** Quick-feature toggle used by the portfolio page. */
export async function toggleProjectFeaturedAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true, featured: true } });
  if (!project) return;

  await prisma.project.update({ where: { id }, data: { featured: !project.featured } });
  revalidatePath("/placement/portfolio");
  revalidatePath("/placement/resume");
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const app = await prisma.application.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!app) return;

  await prisma.application.delete({ where: { id } });
  revalidatePath("/placement");
}

// ─────────────────────────── Mock interviews ───────────────────────────

const interviewSchema = z.object({
  date: z.string().min(1),
  type: z.enum(INTERVIEW_TYPES).default("TECHNICAL"),
  durationMin: z.coerce.number().int().min(1).max(600).optional().or(z.literal("")),
  topic: z.string().trim().max(120).optional().or(z.literal("")),
  selfRating: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  feedback: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function createMockInterviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = interviewSchema.safeParse({
    date: formData.get("date"),
    type: formData.get("type") ?? "TECHNICAL",
    durationMin: formData.get("durationMin"),
    topic: formData.get("topic"),
    selfRating: formData.get("selfRating"),
    feedback: formData.get("feedback"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid interview" };
  const { date, type, durationMin, topic, selfRating, feedback } = parsed.data;

  let levelUp: ActionState["levelUp"];
  await prisma.$transaction(async (tx) => {
    await tx.mockInterview.create({
      data: {
        userId: user.id,
        date: new Date(`${date}T09:00:00`),
        type,
        durationMin: durationMin || null,
        topic: topic || null,
        selfRating: selfRating || null,
        feedback: feedback || null,
        questions: [],
      },
    });
    const award = await awardXp({
      userId: user.id,
      xp: XP_RULES.MOCK_INTERVIEW,
      source: "MOCK_INTERVIEW",
      note: `Mock interview: ${type}`,
      tx,
    });
    if (award.leveledUp) levelUp = { level: award.level };
  });

  revalidatePath("/placement/interview");
  revalidatePath("/dashboard");
  return { ok: true, levelUp };
}

export async function deleteMockInterviewAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const interview = await prisma.mockInterview.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!interview) return;

  await prisma.mockInterview.delete({ where: { id } });
  revalidatePath("/placement/interview");
}
