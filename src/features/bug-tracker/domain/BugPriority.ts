// Severity of a bug; "critical" comes from the specification (EV-84 lot 5)
export const BUG_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type BugPriority = (typeof BUG_PRIORITIES)[number];

export const BUG_PRIORITY_LABELS: Record<BugPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
