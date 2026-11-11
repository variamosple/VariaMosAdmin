import { useCallback, useEffect, useState } from "react";
import { queryScheduledChanges } from "../api/ScheduledChangeRepository";
import type { ScheduledChange } from "../domain/Entity/ScheduledChange";

/** The planned changes and those resolved lately (EV-115 lot B). */
export const useScheduledChanges = () => {
  const [changes, setChanges] = useState<ScheduledChange[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const response = await queryScheduledChanges();
    if (response.errorCode) {
      setError(response.message || "The planned changes could not be loaded.");
    } else {
      setError(null);
      setChanges(response.data ?? []);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { changes, error, reload };
};
