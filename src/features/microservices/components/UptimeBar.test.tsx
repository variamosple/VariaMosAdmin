import { render } from "@testing-library/react";
import type { UptimeHistorySlot } from "../domain/Entity/MicroService";
import { UptimeBar } from "./UptimeBar";

const slot = (
  day: number,
  status: UptimeHistorySlot["status"],
  uptimePercentage: number,
): UptimeHistorySlot => ({
  timestamp: new Date(Date.UTC(2026, 9, day)).toISOString(),
  status,
  responseTimeMs: status === "NO_DATA" ? 0 : 20,
  uptimePercentage,
});

describe("UptimeBar", () => {
  it("shows a slot without a check in grey, never in green (EV-106)", () => {
    const { container } = render(
      <UptimeBar
        history={[
          slot(1, "NO_DATA", 0),
          slot(2, "UP", 100),
          slot(3, "DOWN", 0),
        ]}
        uptimePercentage={50}
      />,
    );

    const colors = [...container.querySelectorAll(".uptime-bar-slot")].map(
      (bar) => (bar as HTMLElement).style.backgroundColor,
    );
    expect(colors).toEqual([
      "rgb(233, 236, 239)",
      "rgb(25, 135, 84)",
      "rgb(220, 53, 69)",
    ]);
  });

  it("shows a degraded slot in orange, even without a successful check", () => {
    const { container } = render(
      <UptimeBar
        history={[slot(1, "DEGRADED", 0), slot(2, "DEGRADED", 50)]}
        uptimePercentage={25}
      />,
    );

    const colors = [...container.querySelectorAll(".uptime-bar-slot")].map(
      (bar) => (bar as HTMLElement).style.backgroundColor,
    );
    expect(colors).toEqual(["rgb(255, 193, 7)", "rgb(255, 193, 7)"]);
  });
});
