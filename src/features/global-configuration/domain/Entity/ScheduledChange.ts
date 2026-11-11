import type { ChangeAnnouncement } from "./ChangeAnnouncement";
import type {
  ConfigurationAnnouncement,
  ConfigurationValue,
} from "./Configuration";

export type ScheduledChangeStatus =
  | "scheduled"
  | "applied"
  | "cancelled"
  | "conflict"
  | "refused";

/** A change of a setting planned for a later date (EV-115 lot B). */
export interface ScheduledChange {
  id: number;
  key: string;
  previousValue: ConfigurationValue;
  newValue: ConfigurationValue;
  /** An instant, in ISO 8601 UTC. */
  dueAt: string;
  status: ScheduledChangeStatus;
  /** Why it was not applied, or how it was. */
  reason: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  /** What to tell users, sent after planning, editing or cancelling. */
  announcement?: ConfigurationAnnouncement;
}

export const STATUS_LABELS: Record<
  ScheduledChangeStatus,
  { label: string; variant: string }
> = {
  scheduled: { label: "Planned", variant: "primary" },
  applied: { label: "Applied", variant: "success" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  conflict: { label: "Not applied", variant: "warning" },
  refused: { label: "Refused", variant: "danger" },
};

/** "2026-11-15 13:00 UTC". */
export const formatUtc = (instant: string): string =>
  `${new Date(instant).toISOString().slice(0, 16).replace("T", " ")} UTC`;

/** A value as the list says it. */
export const describeValue = (value: ConfigurationValue): string => {
  if (typeof value === "boolean") return value ? "on" : "off";
  return typeof value === "string" ? value : JSON.stringify(value);
};

/** The announcement sent back with a change, ready for the dialog. */
export const announcementOfScheduledChange = (
  change: ScheduledChange,
): ChangeAnnouncement | null =>
  change.announcement
    ? {
        keys: [change.key],
        title: change.announcement.title,
        body: [change.announcement.body, change.announcement.note]
          .filter(Boolean)
          .join(" "),
      }
    : null;
