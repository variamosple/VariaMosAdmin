import { useMemo, useState } from "react";
import { cancelScheduledChange } from "../api/ScheduledChangeRepository";
import type { Configuration } from "../domain/Entity/Configuration";
import {
  announcementOfScheduledChange,
  type ScheduledChange,
} from "../domain/Entity/ScheduledChange";
import { useScheduledChanges } from "./useScheduledChanges";

interface ChangePlanningInput {
  configurations: Configuration[];
  /** Offers to announce a planned change, a correction included. */
  offerAnnouncement: (
    suggested: ReturnType<typeof announcementOfScheduledChange>,
  ) => void;
}

/**
 * Changes planned for a later date (EV-115 lot B): the list, the one being
 * written, the one asked to cancel, and what happens once saved or cancelled.
 */
export const useChangePlanning = (input: ChangePlanningInput) => {
  const { configurations, offerAnnouncement } = input;
  const scheduled = useScheduledChanges();
  const plannedByKey = useMemo(
    () =>
      new Map(
        scheduled.changes
          .filter((change) => change.status === "scheduled")
          .map((change) => [change.key, change]),
      ),
    [scheduled.changes],
  );
  const [scheduling, setScheduling] = useState<{
    config: Configuration;
    change?: ScheduledChange;
  }>();
  const [toCancel, setToCancel] = useState<ScheduledChange>();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const announce = (change: ScheduledChange) =>
    offerAnnouncement(announcementOfScheduledChange(change));

  const editPlanned = (change: ScheduledChange) => {
    const config = configurations.find((c) => c.key === change.key);
    if (config) setScheduling({ config, change });
  };

  const onScheduled = (change: ScheduledChange) => {
    setScheduling(undefined);
    void scheduled.reload();
    announce(change);
  };

  const cancelPlanned = async (change: ScheduledChange) => {
    setToCancel(undefined);
    setCancelError(null);
    const response = await cancelScheduledChange(change.id);
    void scheduled.reload();
    if (response.errorCode || !response.data) {
      setCancelError(
        response.message || "The planned change could not be cancelled.",
      );
      return;
    }
    // A correction, for users who were told of the change
    announce(response.data);
  };

  return {
    scheduled,
    plannedByKey,
    scheduling,
    setScheduling,
    toCancel,
    setToCancel,
    cancelError,
    setCancelError,
    editPlanned,
    onScheduled,
    cancelPlanned,
  };
};
