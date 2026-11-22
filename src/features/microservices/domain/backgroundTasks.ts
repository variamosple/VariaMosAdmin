/**
 * A background task of the admin and its runs since the service started, as
 * GET /v1/background-tasks reports them (ADM-N34). Dates are ISO strings.
 */
export interface BackgroundTask {
  name: string;
  intervalMs: number;
  running: boolean;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  consecutiveFailures: number;
}

export interface BackgroundTaskLine {
  name: string;
  failing: boolean;
  text: string;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const plural = (count: number, unit: string): string =>
  `${count} ${unit}${count === 1 ? "" : "s"} ago`;

/** "less than a minute ago", "5 minutes ago", "2 hours ago", "3 days ago". */
export function ageOf(at: string, now: Date): string {
  const elapsedMs = Math.max(0, now.getTime() - new Date(at).getTime());
  if (elapsedMs < MINUTE_MS) return "less than a minute ago";
  if (elapsedMs < HOUR_MS) {
    return plural(Math.floor(elapsedMs / MINUTE_MS), "minute");
  }
  if (elapsedMs < DAY_MS) {
    return plural(Math.floor(elapsedMs / HOUR_MS), "hour");
  }
  return plural(Math.floor(elapsedMs / DAY_MS), "day");
}

const every = (count: number, unit: string): string =>
  count === 1 ? `every ${unit}` : `every ${count} ${unit}s`;

/**
 * "every minute", "every 15 minutes", "every hour", "every day": the largest
 * unit that divides the interval. Null below a minute or for no interval.
 */
export function intervalOf(intervalMs: number): string | null {
  if (!Number.isFinite(intervalMs) || intervalMs < MINUTE_MS) return null;
  if (intervalMs % DAY_MS === 0) return every(intervalMs / DAY_MS, "day");
  if (intervalMs % HOUR_MS === 0) return every(intervalMs / HOUR_MS, "hour");
  return every(Math.round(intervalMs / MINUTE_MS), "minute");
}

const notRunYet = (task: BackgroundTask): string => {
  // The first run comes one interval after the start of the admin
  const interval = intervalOf(task.intervalMs);
  return interval ? `not run yet (${interval})` : "not run yet";
};

const stateOf = (task: BackgroundTask, now: Date): string => {
  if (task.consecutiveFailures > 0) {
    const success = task.lastSuccessAt
      ? `last success ${ageOf(task.lastSuccessAt, now)}`
      : "never succeeded";
    return `failing (${task.consecutiveFailures} in a row), ${success}`;
  }
  if (task.lastRunAt) return `last run ${ageOf(task.lastRunAt, now)}`;
  return notRunYet(task);
};

/** One line per task, the failing ones first, in the order of the admin. */
export function backgroundTaskLinesOf(
  tasks: BackgroundTask[],
  now: Date,
): BackgroundTaskLine[] {
  const lines = tasks.map((task) => ({
    name: task.name,
    failing: task.consecutiveFailures > 0,
    text: `${task.name}: ${stateOf(task, now)}${task.running ? ", running" : ""}.`,
  }));
  return [
    ...lines.filter((line) => line.failing),
    ...lines.filter((line) => !line.failing),
  ];
}
