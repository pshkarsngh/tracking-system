import { prisma } from "@/lib/db";
import type { TrackerTypeValue } from "@/config/trackers";
import type { TrackerData } from "./types";
export type {
  TopicDTO,
  ProblemDTO,
  ProjectDTO,
  SpeakingLogDTO,
  AptitudeAttemptDTO,
  CollegeTaskDTO,
  RecentSessionDTO,
  TrackerData,
} from "./types";
export {
  TOPIC_STATUSES_LABEL,
  PROBLEM_STATUS_LABEL,
  TASK_STATUS_LABEL,
  PRIORITY_LABEL,
  TASK_TYPES,
  TASK_TYPE_LABEL,
} from "./types";

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


