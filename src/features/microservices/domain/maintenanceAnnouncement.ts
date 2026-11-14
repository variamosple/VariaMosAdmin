/** Minutes between the announcement and the suggested restart. */
export const MAINTENANCE_NOTICE_MINUTES = 10;

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const twoDigits = (value: number) => value.toString().padStart(2, "0");

/**
 * The suggested time of the restart: at least the notice ahead, rounded up
 * to the next five minutes so that it reads as a time to remember.
 */
export const maintenanceTimeOf = (now: Date): Date => {
  const earliest = now.getTime() + MAINTENANCE_NOTICE_MINUTES * 60 * 1000;
  return new Date(Math.ceil(earliest / FIVE_MINUTES_MS) * FIVE_MINUTES_MS);
};

/**
 * The suggested announcement before a service restarts (EV-86, MA-NO-05).
 * The time is given in UTC, the one reference shared by every reader; the
 * administrator edits the text before sending it.
 */
export const maintenanceAnnouncementOf = (
  service: { serviceName: string; displayName?: string },
  now: Date,
): { title: string; body: string } => {
  const name = service.displayName || service.serviceName;
  const at = maintenanceTimeOf(now);
  const minutes = Math.round((at.getTime() - now.getTime()) / 60000);
  const time = `${twoDigits(at.getUTCHours())}:${twoDigits(at.getUTCMinutes())} UTC`;
  return {
    title: `Maintenance: ${name}`,
    body:
      `${name} will restart at ${time} (in about ${minutes} minutes) ` +
      "and may be unavailable for a few minutes. Please save your work before then.",
  };
};
