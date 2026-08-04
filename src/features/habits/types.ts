export interface HabitWithData {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequency: string;
  targetCount: number;
  unit: string | null;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  doneToday: boolean;
  week: { key: string; done: boolean; count: number }[];
}

export interface HabitsData {
  today: string;
  habits: HabitWithData[];
  activeCount: number;
  doneTodayCount: number;
}
