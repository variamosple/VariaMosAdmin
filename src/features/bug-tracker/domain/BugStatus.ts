// Statuses of a bug report (T-23). The API checks the same transitions
// (variamos_ms_admin, Domain/Bug/Entity/BugStatus.ts): the interface only
// offers the ones it will accept.

const BUG_STATUS_LABELS: Readonly<Record<string, string>> = {
  pending: "Open (to triage)",
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  rejected: "Invalid",
  purged: "Purged",
};

// Statuses of the bugs that have a GitHub issue, for the filter
export const GITHUB_BUG_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

// Approval (pending to open) has its own form, which creates the issue
const NEXT_STATUSES: Readonly<Record<string, readonly string[]>> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["open", "resolved", "closed"],
  resolved: ["open", "in_progress", "closed"],
  closed: ["open"],
};

export const statusLabel = (status?: string): string =>
  (status && BUG_STATUS_LABELS[status]) || status || "Unknown";

export const nextStatuses = (status?: string): readonly string[] =>
  (status && NEXT_STATUSES[status]) || [];

const isIssueOpen = (status: string) =>
  status === "open" || status === "in_progress";

/** What a change of status does to the public GitHub issue. */
export const githubEffect = (from: string, to: string): string => {
  if (isIssueOpen(from) && !isIssueOpen(to)) {
    return "The GitHub issue will be closed.";
  }
  if (!isIssueOpen(from) && isIssueOpen(to)) {
    return to === "in_progress"
      ? 'The GitHub issue will be reopened and labelled "in progress".'
      : "The GitHub issue will be reopened.";
  }
  if (to === "in_progress") {
    return 'The GitHub issue will be labelled "in progress".';
  }
  return 'The "in progress" label will be removed from the GitHub issue.';
};
