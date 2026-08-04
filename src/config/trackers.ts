import {
  Brain,
  Calculator,
  Code2,
  FolderGit2,
  Globe,
  GraduationCap,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export type TrackerTypeValue = "DSA" | "WEB_DEV" | "AI_ML" | "ENGLISH" | "APTITUDE" | "COLLEGE" | "PROJECT";

export interface TrackerMeta {
  label: string;
  short: string;
  icon: LucideIcon;
  color: string;
  route: string;
}

export const TRACKER_META: Record<TrackerTypeValue, TrackerMeta> = {
  DSA: { label: "DSA", short: "DSA", icon: Code2, color: "#6366f1", route: "/trackers/dsa" },
  WEB_DEV: { label: "Web Dev", short: "Web", icon: Globe, color: "#8b5cf6", route: "/trackers/webdev" },
  AI_ML: { label: "AI / ML", short: "AI", icon: Brain, color: "#a855f7", route: "/trackers/aiml" },
  ENGLISH: { label: "English", short: "Eng", icon: MessageSquare, color: "#10b981", route: "/trackers/english" },
  APTITUDE: { label: "Aptitude", short: "Apt", icon: Calculator, color: "#f59e0b", route: "/trackers/aptitude" },
  COLLEGE: { label: "College", short: "Col", icon: GraduationCap, color: "#0ea5e9", route: "/trackers/college" },
  PROJECT: { label: "Projects", short: "Prj", icon: FolderGit2, color: "#f43f5e", route: "/trackers/projects" },
};

export const TRACKER_TYPES = Object.keys(TRACKER_META) as TrackerTypeValue[];

/** Human label for any tracker type value (safe fallback for unknown strings). */
export function trackerLabel(value: string): string {
  return (TRACKER_META[value as TrackerTypeValue]?.label ?? value);
}

export function trackerColor(value: string): string {
  return TRACKER_META[value as TrackerTypeValue]?.color ?? "#6366f1";
}
