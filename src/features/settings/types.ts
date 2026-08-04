export interface SettingsData {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    timezone: string;
    dailyGoalMinutes: number;
    weeklyGoalMinutes: number;
    darkMode: boolean;
    plan: string;
    xp: number;
    coins: number;
    level: number;
    currentStreak: number;
    bestStreak: number;
  };
}
