import { type FC, useEffect, useState } from "react";
import { getBackupStatus } from "../../api/MicroServiceRepository";
import { type BackupSummary, backupSummaryOf } from "../../domain/backupStatus";

/**
 * The state of the nightly database backup, under the page title (EV-86).
 * Loaded again with the list; nothing is shown when it cannot be read.
 */
export const BackupStatusLine: FC<{ refreshedAt: Date }> = ({
  refreshedAt,
}) => {
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const refreshedAtMs = refreshedAt.getTime();

  useEffect(() => {
    let current = true;
    void getBackupStatus().then((response) => {
      if (!current) return;
      setSummary(
        response.data && !response.errorCode
          ? backupSummaryOf(response.data, new Date(refreshedAtMs))
          : null,
      );
    });
    return () => {
      current = false;
    };
  }, [refreshedAtMs]);

  if (!summary) return null;
  return (
    <p
      className={`small mb-3 ${summary.ok ? "text-muted" : "text-danger fw-semibold"}`}
      role={summary.ok ? undefined : "alert"}
    >
      {summary.text}
    </p>
  );
};
