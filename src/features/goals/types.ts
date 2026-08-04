export interface GoalDTO {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  priority: string;
  targetDate: Date | null;
  startDate: Date;
  progress: number;
  xpEarned: number;
  milestones: { id: string; title: string; done: boolean }[];
  dueInDays: number | null;
  overdue: boolean;
}

export const GOAL_CATEGORY_LABEL: Record<string, string> = {
  DSA: "DSA",
  WEB_DEV: "Web Dev",
  AI_ML: "AI / ML",
  ENGLISH: "English",
  APTITUDE: "Aptitude",
  COLLEGE: "College",
  PROJECT: "Projects",
};

export const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-rose-500/15 text-rose-500" },
  HIGH: { label: "High", cls: "bg-amber-500/15 text-amber-500" },
  MEDIUM: { label: "Medium", cls: "bg-sky-500/15 text-sky-500" },
  LOW: { label: "Low", cls: "bg-muted text-muted-foreground" },
};
