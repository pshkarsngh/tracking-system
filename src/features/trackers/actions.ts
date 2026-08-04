"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import type { ActionState } from "@/lib/server/action";
import { XP_RULES, xpForProblem } from "@/lib/domain/gamification";
import { awardXp } from "@/features/gamification/service";
import type { TrackerTypeValue } from "@/config/trackers";

const TRACKER_VALUES = ["DSA", "WEB_DEV", "AI_ML", "ENGLISH", "APTITUDE", "COLLEGE", "PROJECT"] as const;

const TOPIC_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE", "REVISION"] as const;
const PROBLEM_STATUSES = ["NOT_STARTED", "ATTEMPTED", "SOLVED", "REVISION"] as const;
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const TRACKER_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE", "REVISION"] as const;

function trackerPath(trackerType: string): string {
  return `/trackers/${trackerType.toLowerCase()}`;
}

// ─────────────────────────── Topics ───────────────────────────

const topicSchema = z.object({
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createTopicAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const trackerType = formData.get("trackerType")?.toString() as TrackerTypeValue | undefined;
  if (!trackerType || !TRACKER_VALUES.includes(trackerType as (typeof TRACKER_VALUES)[number]))
    return { error: "Invalid tracker" };

  const parsed = topicSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid topic" };

  await prisma.topic.create({
    data: { userId: user.id, trackerType, name: parsed.data.name, notes: parsed.data.notes || null },
  });

  revalidatePath(trackerPath(trackerType));
  return { ok: true };
}

export async function updateTopicStatusAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status || !TOPIC_STATUSES.includes(status as (typeof TOPIC_STATUSES)[number])) return;

  const topic = await prisma.topic.findFirst({ where: { id, userId: user.id }, select: { id: true, trackerType: true } });
  if (!topic) return;

  await prisma.topic.update({ where: { id }, data: { status: status as (typeof TOPIC_STATUSES)[number] } });
  revalidatePath(trackerPath(topic.trackerType));
  revalidatePath("/dashboard");
}

export async function deleteTopicAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const topic = await prisma.topic.findFirst({ where: { id, userId: user.id }, select: { id: true, trackerType: true } });
  if (!topic) return;

  await prisma.topic.delete({ where: { id } });
  revalidatePath(trackerPath(topic.trackerType));
  revalidatePath("/dashboard");
}

const topicSessionSchema = z.object({
  topicId: z.string().min(1),
  durationMin: z.coerce.number().int().min(1).max(720),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

/** Log a study session against a topic, incrementing its session/minute counters. */
export async function logTopicSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = topicSessionSchema.safeParse({
    topicId: formData.get("topicId"),
    durationMin: formData.get("durationMin"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid session" };

  const { topicId, durationMin, notes } = parsed.data;
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, userId: user.id },
    select: { id: true, name: true, trackerType: true },
  });
  if (!topic) return { error: "Topic not found" };

  const xp = durationMin * XP_RULES.STUDY_MINUTE;
  let levelUp: ActionState["levelUp"];

  await prisma.$transaction(async (tx) => {
    await tx.studySession.create({
      data: {
        userId: user.id,
        trackerType: topic.trackerType,
        topicId: topic.id,
        topicName: topic.name,
        durationMin,
        notes: notes || null,
        startedAt: new Date(Date.now() - durationMin * 60_000),
        xpEarned: xp,
      },
    });
    await tx.topic.update({
      where: { id: topic.id },
      data: { totalSessions: { increment: 1 }, totalMinutes: { increment: durationMin } },
    });
    const award = await awardXp({
      userId: user.id,
      xp,
      source: "STUDY_SESSION",
      sourceId: topic.id,
      note: `${durationMin} min on ${topic.name}`,
      tx,
    });
    if (award.leveledUp) levelUp = { level: award.level };
  });

  revalidatePath(trackerPath(topic.trackerType));
  revalidatePath("/daily");
  revalidatePath("/dashboard");
  return { ok: true, levelUp };
}

// ─────────────────────────── DSA problems ───────────────────────────

const problemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().trim().max(500).optional().or(z.literal("")),
  platform: z.string().trim().max(60).optional().or(z.literal("")),
  difficulty: z.enum(DIFFICULTIES).default("MEDIUM"),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  topicId: z.string().trim().optional().or(z.literal("")),
});

export async function createProblemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = problemSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    platform: formData.get("platform"),
    difficulty: formData.get("difficulty") ?? "MEDIUM",
    tags: formData.get("tags"),
    notes: formData.get("notes"),
    topicId: formData.get("topicId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid problem" };
  const { title, url, platform, difficulty, tags, notes, topicId } = parsed.data;

  await prisma.problem.create({
    data: {
      userId: user.id,
      title,
      url: url || null,
      platform: platform || null,
      difficulty,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10) : [],
      notes: notes || null,
      topicId: topicId || null,
    },
  });

  revalidatePath("/trackers/dsa");
  return { ok: true };
}

/**
 * Set a problem's status. Award XP once on the NOT_STARTED/ATTEMPTED → SOLVED
 * transition (spec §6: 30–100 XP by difficulty). XP is not clawed back on revert.
 */
export async function updateProblemStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status || !PROBLEM_STATUSES.includes(status as (typeof PROBLEM_STATUSES)[number]))
    return { error: "Invalid status" };

  const problem = await prisma.problem.findFirst({
    where: { id, userId: user.id },
    select: { id: true, title: true, difficulty: true, status: true },
  });
  if (!problem) return { error: "Problem not found" };

  const becomingSolved = status === "SOLVED" && problem.status !== "SOLVED";
  const xp = becomingSolved ? xpForProblem(problem.difficulty) : 0;

  let levelUp: ActionState["levelUp"];
  await prisma.$transaction(async (tx) => {
    await tx.problem.update({
      where: { id },
      data: {
        status: status as (typeof PROBLEM_STATUSES)[number],
        solvedAt: status === "SOLVED" ? new Date() : null,
        xpEarned: { increment: xp },
      },
    });
    if (xp > 0) {
      const award = await awardXp({
        userId: user.id,
        xp,
        source: "PROBLEM",
        sourceId: id,
        note: `Solved "${problem.title}" (${problem.difficulty})`,
        tx,
      });
      if (award.leveledUp) levelUp = { level: award.level };
    }
  });

  revalidatePath("/trackers/dsa");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  return { ok: true, levelUp };
}

export async function deleteProblemAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const problem = await prisma.problem.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!problem) return;

  await prisma.problem.delete({ where: { id } });
  revalidatePath("/trackers/dsa");
}

// ─────────────────────────── Projects ───────────────────────────

const projectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  repoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  liveUrl: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(TRACKER_STATUSES).default("IN_PROGRESS"),
  techStack: z.string().trim().max(300).optional().or(z.literal("")),
  featured: z.string().optional().or(z.literal("")),
  progress: z.coerce.number().min(0).max(100).default(0),
});

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const category = formData.get("category")?.toString();
  if (!category || !["WEB_DEV", "AI_ML", "PROJECT"].includes(category)) return { error: "Invalid category" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    repoUrl: formData.get("repoUrl"),
    liveUrl: formData.get("liveUrl"),
    status: formData.get("status") ?? "IN_PROGRESS",
    techStack: formData.get("techStack"),
    featured: formData.get("featured"),
    progress: formData.get("progress") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid project" };
  const { name, description, repoUrl, liveUrl, status, techStack, featured, progress } = parsed.data;

  await prisma.project.create({
    data: {
      userId: user.id,
      name,
      description: description || null,
      category: category as "WEB_DEV" | "AI_ML" | "PROJECT",
      repoUrl: repoUrl || null,
      liveUrl: liveUrl || null,
      status: status as (typeof TRACKER_STATUSES)[number],
      techStack: techStack ? techStack.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12) : [],
      featured: featured === "on",
      progress,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  revalidatePath(`/trackers/${category.toLowerCase()}`);
  revalidatePath("/placement/portfolio");
  revalidatePath("/placement/resume");
  return { ok: true };
}

export async function updateProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return { error: "Missing project id" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    repoUrl: formData.get("repoUrl"),
    liveUrl: formData.get("liveUrl"),
    status: formData.get("status") ?? "IN_PROGRESS",
    techStack: formData.get("techStack"),
    featured: formData.get("featured"),
    progress: formData.get("progress") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid project" };
  const { name, description, repoUrl, liveUrl, status, techStack, featured, progress } = parsed.data;

  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true, category: true } });
  if (!project) return { error: "Project not found" };

  await prisma.project.update({
    where: { id },
    data: {
      name,
      description: description || null,
      repoUrl: repoUrl || null,
      liveUrl: liveUrl || null,
      status: status as (typeof TRACKER_STATUSES)[number],
      techStack: techStack ? techStack.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12) : [],
      featured: featured === "on",
      progress,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  revalidatePath(`/trackers/${project.category.toLowerCase()}`);
  revalidatePath("/placement/portfolio");
  revalidatePath("/placement/resume");
  return { ok: true };
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true, category: true } });
  if (!project) return;

  await prisma.project.delete({ where: { id } });
  revalidatePath(`/trackers/${project.category.toLowerCase()}`);
  revalidatePath("/placement/portfolio");
  revalidatePath("/placement/resume");
}

// ─────────────────────────── English: speaking logs ───────────────────────────

const speakingSchema = z.object({
  date: z.string().min(1),
  durationMin: z.coerce.number().int().min(1).max(600),
  fluency: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  confidence: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  topic: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createSpeakingLogAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = speakingSchema.safeParse({
    date: formData.get("date"),
    durationMin: formData.get("durationMin"),
    fluency: formData.get("fluency"),
    confidence: formData.get("confidence"),
    topic: formData.get("topic"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid log" };
  const { date, durationMin, fluency, confidence, topic, notes } = parsed.data;

  const xp = durationMin * XP_RULES.SPEAKING_MINUTE;
  let levelUp: ActionState["levelUp"];

  await prisma.$transaction(async (tx) => {
    await tx.speakingLog.create({
      data: {
        userId: user.id,
        date: new Date(`${date}T00:00:00`),
        durationMin,
        fluency: fluency || null,
        confidence: confidence || null,
        topic: topic || null,
        notes: notes || null,
      },
    });
    const award = await awardXp({
      userId: user.id,
      xp,
      source: "SPEAKING",
      note: `${durationMin} min of speaking practice`,
      tx,
    });
    if (award.leveledUp) levelUp = { level: award.level };
  });

  revalidatePath("/trackers/english");
  revalidatePath("/dashboard");
  return { ok: true, levelUp };
}

export async function deleteSpeakingLogAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const log = await prisma.speakingLog.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!log) return;

  await prisma.speakingLog.delete({ where: { id } });
  revalidatePath("/trackers/english");
}

// ─────────────────────────── Aptitude attempts ───────────────────────────

const aptitudeSchema = z.object({
  date: z.string().min(1),
  section: z.string().trim().max(60).optional().or(z.literal("")),
  questions: z.coerce.number().int().min(1).max(200),
  correct: z.coerce.number().int().min(0).max(200),
  durationMin: z.coerce.number().int().min(1).max(600).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createAptitudeAttemptAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = aptitudeSchema.safeParse({
    date: formData.get("date"),
    section: formData.get("section"),
    questions: formData.get("questions"),
    correct: formData.get("correct"),
    durationMin: formData.get("durationMin"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid attempt" };
  const { date, section, questions, correct, durationMin, notes } = parsed.data;

  if (correct > questions) return { error: "Correct can't exceed questions" };

  await prisma.aptitudeAttempt.create({
    data: {
      userId: user.id,
      date: new Date(`${date}T00:00:00`),
      section: section || null,
      questions,
      correct,
      durationMin: durationMin || null,
      notes: notes || null,
    },
  });

  revalidatePath("/trackers/aptitude");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAptitudeAttemptAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const attempt = await prisma.aptitudeAttempt.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!attempt) return;

  await prisma.aptitudeAttempt.delete({ where: { id } });
  revalidatePath("/trackers/aptitude");
}

// ─────────────────────────── College tasks ───────────────────────────

const collegeTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum(["ASSIGNMENT", "ATTENDANCE", "CLASS", "EXAM", "LAB"]).default("ASSIGNMENT"),
  subject: z.string().trim().min(1).max(120),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createCollegeTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = collegeTaskSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type") ?? "ASSIGNMENT",
    subject: formData.get("subject"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority") ?? "MEDIUM",
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid task" };
  const { title, type, subject, dueDate, priority, notes } = parsed.data;

  await prisma.collegeTask.create({
    data: {
      userId: user.id,
      title,
      type,
      subject,
      dueDate: dueDate ? new Date(`${dueDate}T23:59:59`) : null,
      priority,
      notes: notes || null,
    },
  });

  revalidatePath("/trackers/college");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateCollegeTaskStatusAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status || !TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) return;

  const task = await prisma.collegeTask.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!task) return;

  await prisma.collegeTask.update({ where: { id }, data: { status: status as (typeof TASK_STATUSES)[number] } });
  revalidatePath("/trackers/college");
  revalidatePath("/dashboard");
}

export async function deleteCollegeTaskAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const task = await prisma.collegeTask.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!task) return;

  await prisma.collegeTask.delete({ where: { id } });
  revalidatePath("/trackers/college");
}
