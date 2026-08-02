import { describe, expect, it } from "vitest";
import { expandCommitments } from "./expand-commitments.js";

describe("weekly commitment expansion", () => {
  it("protects selected weekdays at the chosen local AM/PM times", () => {
    const result = expandCommitments(
      [{
        id: "work",
        title: "Work",
        category: "Work",
        startAt: new Date("2026-07-27T06:30:00.000Z"),
        endAt: new Date("2026-07-27T14:30:00.000Z"),
        recurrence: "weekly",
        recurrenceDays: [1, 2, 3, 4, 5],
      }],
      new Date("2026-07-27T00:00:00.000Z"),
      new Date("2026-08-03T00:00:00.000Z"),
      "Asia/Karachi",
    );

    expect(result).toHaveLength(5);
    expect(result[0]?.startAt.toISOString()).toBe("2026-07-27T06:30:00.000Z");
    expect(result[0]?.endAt.toISOString()).toBe("2026-07-27T14:30:00.000Z");
  });

  it("can exclude Wednesday from a weekly activity", () => {
    const result = expandCommitments(
      [{
        id: "boxing",
        title: "Boxing",
        category: "Exercise",
        startAt: new Date("2026-07-27T15:00:00.000Z"),
        endAt: new Date("2026-07-27T16:00:00.000Z"),
        recurrence: "weekly",
        recurrenceDays: [1, 2, 4, 5],
      }],
      new Date("2026-07-27T00:00:00.000Z"),
      new Date("2026-08-03T00:00:00.000Z"),
      "Asia/Karachi",
    );

    expect(result).toHaveLength(4);
    expect(result.map((item) => item.startAt.getUTCDay())).toEqual([1, 2, 4, 5]);
  });
});
