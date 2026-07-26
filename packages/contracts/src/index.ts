export type TimeOfDay = "morning" | "afternoon" | "evening";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type BlockType =
  | "task"
  | "commitment"
  | "exercise"
  | "meal"
  | "break"
  | "leisure";
export type BlockStatus =
  | "planned"
  | "completed"
  | "skipped"
  | "rescheduled";

export interface UserPreferences {
  timezone: string;
  dayStart: string;
  dayEnd: string;
  focusSessionMinutes: number;
  shortBreakMinutes: number;
  preferredStudyTime: TimeOfDay;
  energyByTime: Record<TimeOfDay, number>;
  exerciseMinutesPerWeek: number;
  leisureMinutesPerDay: number;
  autoScheduleLifestyle: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: string;
  dueAt: string;
  estimatedMinutes: number;
  remainingMinutes: number;
  priority: number;
  difficulty: number;
  preferredTimeOfDay?: TimeOfDay;
  status: TaskStatus;
}

export interface Commitment {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  category: string;
}

export interface ScheduleBlock {
  id: string;
  sourceId?: string;
  title: string;
  type: BlockType;
  startAt: string;
  endAt: string;
  locked: boolean;
  status: BlockStatus;
  rationale: string;
  score?: number;
}

export interface Plan {
  id: string;
  rangeStart: string;
  rangeEnd: string;
  modelVersion: string;
  blocks: ScheduleBlock[];
  createdAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}
