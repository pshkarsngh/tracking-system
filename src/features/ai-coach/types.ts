export interface CoachMessage {
  id: string;
  kind: string;
  prompt: string;
  response: string;
  model: string | null;
  createdAt: Date;
}

export interface CoachData {
  history: CoachMessage[];
  recentActivity: {
    focusMinutes: number;
    problemsSolved: number;
    habitsDone: number;
    streak: number;
  };
}
