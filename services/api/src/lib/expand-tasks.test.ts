import { describe, expect, it } from "vitest";
import { expandTasks, type SchedulableTask } from "./expand-tasks.js";

const task: SchedulableTask = {
  id: "task-1",
  title: "Workout",
  category: "Health",
  dueAt: new Date("2026-07-27T18:00:00.000Z"),
  estimatedMinutes: 45,
  remainingMinutes: 20,
  priority: 3,
  difficulty: 2,
};
const rangeStart = new Date("2026-07-26T00:00:00.000Z");
const rangeEnd = new Date("2026-08-03T00:00:00.000Z");

describe("repeating task expansion", () => {
  it("keeps a non-repeating task as one task with its remaining work", () => {
    const result = expandTasks([{ ...task, recurrence: "none" }], rangeStart, rangeEnd);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "task-1", remainingMinutes: 20 });
  });

  it("creates a fresh occurrence for every weekday", () => {
    const result = expandTasks(
      [{ ...task, recurrence: "weekdays" }],
      rangeStart,
      rangeEnd,
    );

    expect(result).toHaveLength(5);
    expect(result.every((item) => item.remainingMinutes === 45)).toBe(true);
    expect(result.map((item) => item.dueAt.getUTCDay())).toEqual([1, 2, 3, 4, 5]);
    expect(result[0]?.id).toContain("task-1:");
  });

  it("repeats weekly on the first deadline's weekday", () => {
    const result = expandTasks(
      [{ ...task, recurrence: "weekly" }],
      rangeStart,
      new Date("2026-08-11T00:00:00.000Z"),
    );

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.dueAt.getUTCDay())).toEqual([1, 1, 1]);
  });
});
