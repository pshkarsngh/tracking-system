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
