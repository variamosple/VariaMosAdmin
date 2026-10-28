import type { MicroService } from "./Entity/MicroService";

/** Where a start, restart or stop stands, as shown on its row (EV-86 lot 3). */
export type FollowUpStep = "starting" | "restarting" | "stopping" | "failed";

export interface FollowUp {
  step: FollowUpStep;
  // When the action was asked for, in milliseconds
  since: number;
}

// A service that is not back after this long is shown as failed
export const FOLLOW_UP_TIMEOUT_MS = 90_000;
// How often a pending start or restart is checked again
export const FOLLOW_UP_POLL_MS = 5_000;

export const serviceKeyOf = (microService: MicroService): string =>
  microService.serviceName || microService.id || microService.displayName;

export const isWaitingForService = (followUp: FollowUp): boolean =>
  followUp.step === "starting" || followUp.step === "restarting";

/**
 * Outcome of a start or restart, from the service as last listed. Only a
 * check made after the action counts: the UP of before a restart says
 * nothing about whether the service came back. A service shown as failed
 * that answers later is running again.
 */
export const followUpOutcome = (
  followUp: FollowUp,
  microService: MicroService | undefined,
  now: number,
): "running" | "failed" | "pending" => {
  if (followUp.step === "stopping") return "pending";
  const health = microService?.health;
  const checkedAt = health?.checkedAt ? Date.parse(health.checkedAt) : NaN;
  if (
    checkedAt >= followUp.since &&
    (health?.status === "UP" || health?.status === "DEGRADED")
  ) {
    return "running";
  }
  if (followUp.step === "failed") return "pending";
  return now - followUp.since > FOLLOW_UP_TIMEOUT_MS ? "failed" : "pending";
};
