const DAY_MS = 86_400_000;

export interface SchedulableTask {
  id: string;
  title: string;
  category: string;
  dueAt: Date;
  estimatedMinutes: number;
  remainingMinutes: number;
  priority: number;
  difficulty: number;
  preferredTimeOfDay?: "morning" | "afternoon" | "evening";
  recurrence?: "none" | "daily" | "weekdays" | "weekly";
}

export type ExpandedTask = Omit<
  SchedulableTask,
  "estimatedMinutes" | "recurrence"
>;

export const expandTasks = (
  tasks: SchedulableTask[],
  rangeStart: Date,
  rangeEnd: Date,
): ExpandedTask[] =>
  tasks.flatMap((task) => {
    if (!task.recurrence || task.recurrence === "none") {
      return [{
        id: task.id,
        title: task.title,
        category: task.category,
        dueAt: task.dueAt,
        remainingMinutes: task.remainingMinutes,
        priority: task.priority,
        difficulty: task.difficulty,
        preferredTimeOfDay: task.preferredTimeOfDay,
      }];
    }

    const occurrences: ExpandedTask[] = [];
    const stepDays = task.recurrence === "weekly" ? 7 : 1;
    let dueAt = new Date(task.dueAt);
    while (dueAt < rangeStart) {
      dueAt = new Date(dueAt.getTime() + stepDays * DAY_MS);
    }
    while (dueAt < rangeEnd) {
      const isWeekday = dueAt.getUTCDay() > 0 && dueAt.getUTCDay() < 6;
      if (task.recurrence !== "weekdays" || isWeekday) {
        occurrences.push({
          id: `${task.id}:${dueAt.toISOString()}`,
          title: task.title,
          category: task.category,
          dueAt: new Date(dueAt),
          remainingMinutes: task.estimatedMinutes,
          priority: task.priority,
          difficulty: task.difficulty,
          preferredTimeOfDay: task.preferredTimeOfDay,
        });
      }
      dueAt = new Date(dueAt.getTime() + stepDays * DAY_MS);
    }
    return occurrences;
  });
