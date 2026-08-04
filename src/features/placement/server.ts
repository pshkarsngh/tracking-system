import { prisma } from "@/lib/db";
import {
  placementReadinessScore,
  type PlacementReadinessInput,
} from "@/lib/domain/scores";

export interface ApplicationDTO {
  id: string;
  company: string;
  role: string;
  url: string | null;
  location: string | null;
  salary: string | null;
  status: string;
  appliedAt: Date;
  lastUpdated: Date;
  nextRoundAt: Date | null;
  notes: string | null;
  resumeVersion: string | null;
}

export interface MockInterviewDTO {
  id: string;
  date: Date;
  type: string;
  durationMin: number | null;
  topic: string | null;
  selfRating: number | null;
  feedback: string | null;
  xpEarned: number;
}

export interface FeaturedProjectDTO {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  status: string;
  techStack: string[];
  progress: number;
}

export interface ReadinessBreakdown {
  dsa: number;
  aptitude: number;
  communication: number;
  projects: number;
  resume: number;
  interview: number;
  score: number;
}

export interface PlacementData {
  applications: ApplicationDTO[];
  counts: Record<string, number>;
  readiness: ReadinessBreakdown;
  user: { name: string; email: string; image: string | null; placementTargetDate: Date | null };
  featuredProjects: FeaturedProjectDTO[];
  mockInterviews: MockInterviewDTO[];
  daysToTarget: number | null;
}

const STATUS_ORDER = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];

export const STATUS_ORDER_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const INTERVIEW_TYPE_LABEL: Record<string, string> = {
  TECHNICAL: "Technical",
  DSA: "DSA",
  SYSTEM_DESIGN: "System design",
  HR: "HR",
  BEHAVIORAL: "Behavioral",
  CODING: "Coding",
};

export const INTERVIEW_TYPES = ["TECHNICAL", "DSA", "SYSTEM_DESIGN", "HR", "BEHAVIORAL", "CODING"];

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Compute the six placement-readiness inputs from live domain data (spec §7). */
export async function getReadinessInputs(userId: string): Promise<PlacementReadinessInput> {
  const [problems, aptitude, speaking, projects, interviews] = await Promise.all([
    prisma.problem.findMany({ where: { userId }, select: { status: true } }),
    prisma.aptitudeAttempt.findMany({ where: { userId }, select: { correct: true, questions: true } }),
    prisma.speakingLog.findMany({ where: { userId }, select: { fluency: true, confidence: true } }),
    prisma.project.findMany({ where: { userId, featured: true }, select: { progress: true, status: true, techStack: true } }),
    prisma.mockInterview.findMany({ where: { userId }, select: { selfRating: true, xpEarned: true } }),
  ]);

  const total = problems.length;
  const solved = problems.filter((p) => p.status === "SOLVED").length;
  const dsa = total > 0 ? clampPct((solved / total) * 100) : 0;

  const aptitudeSum = aptitude.reduce((s, a) => s + (a.questions > 0 ? (a.correct / a.questions) * 100 : 0), 0);
  const aptitudeScore = aptitude.length > 0 ? clampPct(aptitudeSum / aptitude.length) : 0;

  const ratings = speaking.flatMap((s) => [s.fluency, s.confidence]).filter((v): v is number => v !== null);
  const communication = ratings.length > 0 ? clampPct((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) : 0;

  const projectsScore =
    projects.length > 0
      ? clampPct(projects.reduce((s, p) => s + (p.status === "DONE" ? 100 : p.progress), 0) / projects.length)
      : 0;

  const resume = clampPct(projects.length * 25); // presence of featured work
  const interview = interviews.length > 0 ? clampPct(Math.min(100, interviews.length * 20 + 20)) : 0;

  return { dsa, aptitude: aptitudeScore, communication, projects: projectsScore, resume, interview };
}

export async function getPlacementData(userId: string): Promise<PlacementData> {
  const [applications, readiness, user, featuredProjects, mockInterviews] = await Promise.all([
    prisma.application.findMany({ where: { userId }, orderBy: { lastUpdated: "desc" } }),
    getReadinessInputs(userId),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, image: true, placementTargetDate: true },
    }),
    prisma.project.findMany({
      where: { userId, featured: true },
      orderBy: [{ status: "asc" }, { progress: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        repoUrl: true,
        liveUrl: true,
        status: true,
        techStack: true,
        progress: true,
      },
    }),
    prisma.mockInterview.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 30 }),
  ]);

  const counts: Record<string, number> = {};
  for (const s of STATUS_ORDER) counts[s] = 0;
  for (const a of applications) counts[a.status] = (counts[a.status] ?? 0) + 1;

  const daysToTarget = user.placementTargetDate
    ? Math.ceil((user.placementTargetDate.getTime() - Date.now()) / 86_400_000)
    : null;

  return {
    applications,
    counts,
    readiness: {
      ...readiness,
      score: placementReadinessScore(readiness),
    },
    user,
    featuredProjects,
    mockInterviews,
    daysToTarget,
  };
}

export async function getPortfolioData(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: [{ featured: "desc" }, { status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      repoUrl: true,
      liveUrl: true,
      status: true,
      techStack: true,
      featured: true,
      progress: true,
    },
  });
  return { projects, featuredCount: projects.filter((p) => p.featured).length };
}

export async function getInterviewData(userId: string) {
  const [interviews, user] = await Promise.all([
    prisma.mockInterview.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } }),
  ]);

  const totalMin = interviews.reduce((s, i) => s + (i.durationMin ?? 0), 0);
  const avgRating = interviews.length
    ? Math.round((interviews.reduce((s, i) => s + (i.selfRating ?? 0), 0) / interviews.length) * 10) / 10
    : 0;

  return { interviews, user, totalMin, avgRating };
}
