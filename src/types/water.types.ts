
export interface WaterLogEntry {
  id: number;
  date: string;
  amount: number;
  goal: number;
  completed: boolean;
}

export interface WaterStats {
  currentAmount: number;
  dailyGoal: number;
  streak: number;
  completedDays: number;
}
