/** The state of the nightly database backup, as the admin reports it (EV-86). */
export interface BackupReport {
  /** False when the admin has no backup status file (local, CI). */
  configured: boolean;
  status: {
    file: string | null;
    createdAt: string | null;
    sizeBytes: number | null;
  } | null;
  problems: { kind: string; message: string }[];
}

export interface BackupSummary {
  ok: boolean;
  text: string;
}

const HOUR_MS = 60 * 60 * 1000;

const ageOf = (createdAt: Date, now: Date): string => {
  const hours = Math.floor((now.getTime() - createdAt.getTime()) / HOUR_MS);
  if (hours < 1) return "less than an hour ago";
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
};

/** The line of the monitoring page; null when there is nothing to show. */
export function backupSummaryOf(
  report: BackupReport,
  now: Date,
): BackupSummary | null {
  if (!report.configured) return null;
  if (report.problems.length > 0) {
    return {
      ok: false,
      text: `Database backup: ${report.problems.map((problem) => problem.message).join(" ")}`,
    };
  }
  const createdAt = report.status?.createdAt;
  if (!createdAt) return null;
  const size = report.status?.sizeBytes;
  const megabytes =
    typeof size === "number" ? `, ${(size / (1024 * 1024)).toFixed(1)} MB` : "";
  return {
    ok: true,
    text: `Last database backup: ${ageOf(new Date(createdAt), now)}${megabytes}, intact.`,
  };
}
