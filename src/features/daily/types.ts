export interface DailySession {
  id: string;
  trackerType: string;
  topicName: string;
  durationMin: number;
  xpEarned: number;
  startedAt: Date;
  notes: string | null;
}

export interface DailyData {
  dateKey: string;
  label: string;
  focusMinutes: number;
  xpEarned: number;
  sessionCount: number;
  goalMinutes: number;
  yesterdayMinutes: number;
  sessions: DailySession[];
  topicsByTracker: { trackerType: string; topics: { id: string; name: string }[] }[];
}
