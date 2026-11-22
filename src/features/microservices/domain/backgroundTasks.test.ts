import {
  ageOf,
  type BackgroundTask,
  backgroundTaskLinesOf,
} from "./backgroundTasks";

const NOW = new Date("2026-11-22T15:00:00Z");

const task = (overrides: Partial<BackgroundTask> = {}): BackgroundTask => ({
  name: "Journals purge",
  intervalMs: 24 * 60 * 60 * 1000,
  running: false,
  lastRunAt: "2026-11-22T14:55:00Z",
  lastSuccessAt: "2026-11-22T14:55:00Z",
  lastFailureAt: null,
  consecutiveFailures: 0,
  ...overrides,
});

describe("background tasks (ADM-N34)", () => {
  it("gives the age in minutes, hours or days", () => {
    expect(ageOf("2026-11-22T14:59:30Z", NOW)).toBe("less than a minute ago");
    expect(ageOf("2026-11-22T14:59:00Z", NOW)).toBe("1 minute ago");
    expect(ageOf("2026-11-22T14:15:00Z", NOW)).toBe("45 minutes ago");
    expect(ageOf("2026-11-22T14:00:00Z", NOW)).toBe("1 hour ago");
    expect(ageOf("2026-11-22T02:00:00Z", NOW)).toBe("13 hours ago");
    expect(ageOf("2026-11-19T15:00:00Z", NOW)).toBe("3 days ago");
  });

  it("does not go below zero when the clocks differ", () => {
    expect(ageOf("2026-11-22T15:00:20Z", NOW)).toBe("less than a minute ago");
  });

  it("gives the last run of a task that works", () => {
    expect(backgroundTaskLinesOf([task()], NOW)).toEqual([
      {
        name: "Journals purge",
        failing: false,
        text: "Journals purge: last run 5 minutes ago.",
      },
    ]);
  });

  it("says a task has not run yet, and when it is running", () => {
    const lines = backgroundTaskLinesOf(
      [
        task({
          name: "Periodic bugs synchronization",
          lastRunAt: null,
          lastSuccessAt: null,
        }),
        task({ running: true }),
      ],
      NOW,
    );

    expect(lines.map((line) => line.text)).toEqual([
      "Periodic bugs synchronization: not run yet.",
      "Journals purge: last run 5 minutes ago, running.",
    ]);
  });

  it("gives the failures in a row and the last success of a failing task", () => {
    const [line] = backgroundTaskLinesOf(
      [
        task({
          lastFailureAt: "2026-11-22T14:55:00Z",
          lastSuccessAt: "2026-11-22T13:00:00Z",
          consecutiveFailures: 3,
        }),
      ],
      NOW,
    );

    expect(line).toEqual({
      name: "Journals purge",
      failing: true,
      text: "Journals purge: failing (3 in a row), last success 2 hours ago.",
    });
  });

  it("says a failing task never succeeded", () => {
    const [line] = backgroundTaskLinesOf(
      [task({ lastSuccessAt: null, consecutiveFailures: 1 })],
      NOW,
    );

    expect(line?.text).toBe(
      "Journals purge: failing (1 in a row), never succeeded.",
    );
  });

  it("puts the failing tasks first and keeps the order of the others", () => {
    const lines = backgroundTaskLinesOf(
      [
        task({ name: "A" }),
        task({ name: "B", consecutiveFailures: 2 }),
        task({ name: "C" }),
      ],
      NOW,
    );

    expect(lines.map((line) => line.name)).toEqual(["B", "A", "C"]);
  });
});
