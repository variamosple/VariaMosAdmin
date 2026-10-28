import { describe, expect, it } from "vitest";
import {
  FOLLOW_UP_TIMEOUT_MS,
  type FollowUp,
  followUpOutcome,
} from "./actionFollowUp";
import type { HealthStatus, MicroService } from "./Entity/MicroService";

const SINCE = Date.parse("2026-10-28T20:00:00Z");

const service = (status: HealthStatus, checkedAt?: string): MicroService =>
  ({
    serviceName: "variamos_ms_languages",
    displayName: "Languages",
    health: { status, serviceName: "variamos_ms_languages", checkedAt },
  }) as MicroService;

const restarting: FollowUp = { step: "restarting", since: SINCE };

describe("followUpOutcome", () => {
  it("is running once a check made after the action says UP", () => {
    expect(
      followUpOutcome(
        restarting,
        service("UP", "2026-10-28T20:00:12Z"),
        SINCE + 12_000,
      ),
    ).toBe("running");
  });

  it("counts a DEGRADED answer as running", () => {
    expect(
      followUpOutcome(
        restarting,
        service("DEGRADED", "2026-10-28T20:00:12Z"),
        SINCE + 12_000,
      ),
    ).toBe("running");
  });

  it("ignores the UP of a check made before the action", () => {
    expect(
      followUpOutcome(
        restarting,
        service("UP", "2026-10-28T19:59:30Z"),
        SINCE + 5_000,
      ),
    ).toBe("pending");
  });

  it("keeps waiting while the service is down, within the time limit", () => {
    expect(
      followUpOutcome(
        restarting,
        service("DOWN", "2026-10-28T20:00:05Z"),
        SINCE + FOLLOW_UP_TIMEOUT_MS,
      ),
    ).toBe("pending");
  });

  it("fails once the time limit has passed without the service back", () => {
    expect(
      followUpOutcome(
        restarting,
        service("DOWN", "2026-10-28T20:01:20Z"),
        SINCE + FOLLOW_UP_TIMEOUT_MS + 1,
      ),
    ).toBe("failed");
  });

  it("fails when the service is no longer listed after the time limit", () => {
    expect(
      followUpOutcome(restarting, undefined, SINCE + FOLLOW_UP_TIMEOUT_MS + 1),
    ).toBe("failed");
  });

  it("leaves a stop to the answer of the action", () => {
    expect(
      followUpOutcome(
        { step: "stopping", since: SINCE },
        service("UP", "2026-10-28T20:00:12Z"),
        SINCE + FOLLOW_UP_TIMEOUT_MS + 1,
      ),
    ).toBe("pending");
  });

  it("keeps a failure until a later check finds the service back", () => {
    const failed: FollowUp = { step: "failed", since: SINCE };
    const later = SINCE + 3 * FOLLOW_UP_TIMEOUT_MS;

    expect(
      followUpOutcome(failed, service("DOWN", "2026-10-28T20:04:00Z"), later),
    ).toBe("pending");
    expect(
      followUpOutcome(failed, service("UP", "2026-10-28T20:04:00Z"), later),
    ).toBe("running");
  });
});
