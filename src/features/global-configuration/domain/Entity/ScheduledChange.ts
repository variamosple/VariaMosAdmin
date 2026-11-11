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

const UTC_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * The instant of a date and time typed in UTC ("2026-11-15T13:00", as a
 * datetime-local field gives it); null when it is not one.
 */
export const instantOfUtcInput = (input: string): string | null => {
  if (!UTC_INPUT.test(input)) return null;
  const at = new Date(`${input}:00Z`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
};

/** The value of a datetime-local field for an instant, in UTC. */
export const utcInputOf = (instant: string | Date): string =>
  new Date(instant).toISOString().slice(0, 16);

/** "2026-11-15 13:00 UTC". */
export const formatUtc = (instant: string): string =>
  `${new Date(instant).toISOString().slice(0, 16).replace("T", " ")} UTC`;

/** The same instant in the time zone of the browser, with its name. */
export const formatLocal = (instant: string, timeZone?: string): string => {
  try {
    // dateStyle cannot go with timeZoneName: the fields are named one by one
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone,
    }).format(new Date(instant));
  } catch {
    return formatUtc(instant);
  }
};

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
