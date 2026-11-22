import { type FC, useEffect, useId, useState } from "react";
import { getBackgroundTasks } from "../../api/MicroServiceRepository";
import {
  type BackgroundTaskLine,
  backgroundTaskLinesOf,
} from "../../domain/backgroundTasks";

/**
 * The background tasks of the admin and their last runs, under the backup
 * line (ADM-N34). Loaded again with the list; nothing is shown when they
 * cannot be read.
 */
export const BackgroundTasksBlock: FC<{ refreshedAt: Date }> = ({
  refreshedAt,
}) => {
  const [lines, setLines] = useState<BackgroundTaskLine[]>([]);
  const refreshedAtMs = refreshedAt.getTime();
  const titleId = useId();

  useEffect(() => {
    let current = true;
    void getBackgroundTasks().then((response) => {
      if (!current) return;
      setLines(
        response.data && !response.errorCode
          ? backgroundTaskLinesOf(response.data, new Date(refreshedAtMs))
          : [],
      );
    });
    return () => {
      current = false;
    };
  }, [refreshedAtMs]);

  if (lines.length === 0) return null;
  const isFailing = lines.some((line) => line.failing);
  return (
    <section aria-labelledby={titleId} className="small mb-3">
      <h2 id={titleId} className="h6 mb-1">
        Background tasks
      </h2>
      {/* The alert is inside: on the section, it would replace its region */}
      <div role={isFailing ? "alert" : undefined}>
        <ul className="list-unstyled mb-0">
          {lines.map((line) => (
            <li
              key={line.name}
              className={
                line.failing ? "text-danger fw-semibold" : "text-muted"
              }
            >
              {line.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
