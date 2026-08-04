export interface XpHistoryEntry {
  id: string;
  xp: number;
  coins: number;
  source: string;
  note: string | null;
  createdAt: Date;
}

export interface BadgeDTO {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: number;
  earned: boolean;
  earnedAt?: Date | null;
}

export interface ChallengeDTO {
  id: string;
  title: string;
  description: string | null;
  type: string;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  startsAt: Date;
  endsAt: Date;
  progress: number;
  claimed: boolean;
  completed: boolean;
}

export interface GamificationData {
  xp: number;
  coins: number;
  level: number;
  levelTitle: string;
  levelProgress: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  bestStreak: number;
  xpHistory: XpHistoryEntry[];
  badges: BadgeDTO[];
  challenges: ChallengeDTO[];
}
