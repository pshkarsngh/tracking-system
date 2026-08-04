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
