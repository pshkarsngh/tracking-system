import { prisma } from "@/lib/db";
import type { TrackerTypeValue } from "@/config/trackers";

export interface TopicDTO {
  id: string;
  name: string;
  status: string;
  notes: string | null;
  totalSessions: number;
  totalMinutes: number;
}

export interface ProblemDTO {
  id: string;
  title: string;
  url: string | null;
  platform: string | null;
  difficulty: string;
  tags: string[];
  status: string;
  notes: string | null;
  topicId: string | null;
  topicName: string | null;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  category: string;
  repoUrl: string | null;
  liveUrl: string | null;
  status: string;
  techStack: string[];
  featured: boolean;
  progress: number;
}

export interface SpeakingLogDTO {
  id: string;
  date: Date;
  durationMin: number;
  fluency: number | null;
  confidence: number | null;
  topic: string | null;
  notes: string | null;
}

export interface AptitudeAttemptDTO {
  id: string;
  date: Date;
  section: string | null;
  questions: number;
  correct: number;
  durationMin: number | null;
  notes: string | null;
}

export interface CollegeTaskDTO {
  id: string;
  title: string;
  type: string;
  subject: string;
  dueDate: Date | null;
  status: string;
  priority: string;
  notes: string | null;
}

export interface RecentSessionDTO {
  id: string;
  topicName: string;
  durationMin: number;
  xpEarned: number;
  startedAt: Date;
}

export interface TrackerData {
  trackerType: TrackerTypeValue;
  stats: {
    activeTopics: number;
    totalMinutes: number;
    totalSessions: number;
    streak: number;
  };
  topics: TopicDTO[];
  problems: ProblemDTO[];
  projects: ProjectDTO[];
  speakingLogs: SpeakingLogDTO[];
  aptitudeAttempts: AptitudeAttemptDTO[];
  collegeTasks: CollegeTaskDTO[];
  recentSessions: RecentSessionDTO[];
}

export async function getTrackerData(userId: string, trackerType: TrackerTypeValue): Promise<TrackerData> {
  const [topics, problems, projects, speakingLogs, aptitudeAttempts, collegeTasks, sessions] = await Promise.all([
    prisma.topic.findMany({
      where: { userId, trackerType },
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true, notes: true, totalSessions: true, totalMinutes: true },
    }),
    trackerType === "DSA"
      ? prisma.problem.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            url: true,
            platform: true,
            difficulty: true,
            tags: true,
            status: true,
            notes: true,
            topicId: true,
            topic: { select: { name: true } },
          },
        }).then((rows) =>
          rows.map((r) => ({ ...r, topicName: r.topic?.name ?? null }))
        )
      : Promise.resolve([]),
    trackerType === "WEB_DEV" || trackerType === "AI_ML" || trackerType === "PROJECT"
      ? prisma.project.findMany({
          where: { userId, category: trackerType },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            repoUrl: true,
            liveUrl: true,
            status: true,
            techStack: true,
            featured: true,
            progress: true,
          },
        })
      : Promise.resolve([]),
    trackerType === "ENGLISH"
      ? prisma.speakingLog.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 })
      : Promise.resolve([]),
    trackerType === "APTITUDE"
      ? prisma.aptitudeAttempt.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 })
      : Promise.resolve([]),
    trackerType === "COLLEGE"
      ? prisma.collegeTask.findMany({
          where: { userId },
          orderBy: [{ status: "asc" }, { dueDate: "asc" }],
          select: {
            id: true,
            title: true,
            type: true,
            subject: true,
            dueDate: true,
            status: true,
            priority: true,
            notes: true,
          },
        })
      : Promise.resolve([]),
    prisma.studySession.findMany({
      where: { userId, trackerType },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: { id: true, topicName: true, durationMin: true, xpEarned: true, startedAt: true },
    }),
  ]);

  const totalMinutes = sessions.reduce((s, x) => s + x.durationMin, 0);

  return {
    trackerType,
    stats: {
      activeTopics: topics.filter((t) => t.status === "IN_PROGRESS").length,
      totalMinutes,
      totalSessions: sessions.length,
      streak: 0,
    },
    topics,
    problems,
    projects,
    speakingLogs,
    aptitudeAttempts,
    collegeTasks,
    recentSessions: sessions,
  };
}

export const TOPIC_STATUSES_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  REVISION: "Revision",
};

export const PROBLEM_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  ATTEMPTED: "Attempted",
  SOLVED: "Solved",
  REVISION: "Revision",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
};

export const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_TYPES = ["ASSIGNMENT", "ATTENDANCE", "CLASS", "EXAM", "LAB"];
export const TASK_TYPE_LABEL: Record<string, string> = {
  ASSIGNMENT: "Assignment",
  ATTENDANCE: "Attendance",
  CLASS: "Class",
  EXAM: "Exam",
  LAB: "Lab",
};
