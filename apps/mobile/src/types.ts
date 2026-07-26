export interface User {
  id: string;
  email: string;
  displayName: string;
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
  status: "todo" | "in_progress" | "completed" | "archived";
}
export interface ScheduleBlock {
  id: string;
  title: string;
  type: "task" | "commitment" | "exercise" | "meal" | "break" | "leisure";
  startAt: string;
  endAt: string;
  rationale: string;
  status: "planned" | "completed" | "skipped" | "rescheduled";
}
export interface Plan {
  id: string;
  modelVersion: string;
  blocks: ScheduleBlock[];
}
