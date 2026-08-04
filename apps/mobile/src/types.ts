export interface User {
  id: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
}
export interface UserPreferences {
  timezone: string;
  clockFormat: "12h" | "24h";
  dayStart: string;
  dayEnd: string;
  focusSessionMinutes: number;
  shortBreakMinutes: number;
  preferredStudyTime: "morning" | "afternoon" | "evening";
  energyByTime: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  exerciseMinutesPerWeek: number;
  leisureMinutesPerDay: number;
  autoScheduleLifestyle: boolean;
}
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}
export interface Task {
  id: string;
  title: string;
  category: string;
  dueAt: string;
  estimatedMinutes: number;
  remainingMinutes: number;
  priority: number;
  difficulty: number;
  recurrence: "none" | "daily" | "weekdays" | "weekly";
  status: "todo" | "in_progress" | "completed" | "archived";
}
export interface ScheduleBlock {
  id: string;
  title: string;
  type: "task" | "commitment" | "exercise" | "meal" | "break" | "leisure";
  startAt: string;
  endAt: string;
  locked: boolean;
  rationale: string;
  status: "planned" | "completed" | "skipped" | "rescheduled";
}
export interface Plan {
  id: string;
  rangeStart: string;
  rangeEnd: string;
  modelVersion: string;
  blocks: ScheduleBlock[];
}
