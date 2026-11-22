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

const stateOf = (task: BackgroundTask, now: Date): string => {
  if (task.consecutiveFailures > 0) {
    const success = task.lastSuccessAt
      ? `last success ${ageOf(task.lastSuccessAt, now)}`
      : "never succeeded";
    return `failing (${task.consecutiveFailures} in a row), ${success}`;
  }
  if (task.lastRunAt) return `last run ${ageOf(task.lastRunAt, now)}`;
  return "not run yet";
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
