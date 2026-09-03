import type { FC } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import type { UptimeHistorySlot } from "../domain/Entity/MicroService";

export interface UptimeBarProps {
  history?: UptimeHistorySlot[];
  uptimePercentage?: number;
  days?: number;
}

export const UptimeBar: FC<UptimeBarProps> = ({
  history = [],
  uptimePercentage = 100,
  days = 30,
}) => {
  const hasRecordedData = history.length > 0;

  // Ensure we display 30 slots
  const slots: UptimeHistorySlot[] = hasRecordedData
    ? history
    : Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - (29 - i) * 86400000).toISOString(),
        status: "NO_DATA" as any,
        responseTimeMs: 0,
        uptimePercentage: 0,
      }));

  const getSlotColor = (slot: UptimeHistorySlot): string => {
    if ((slot.status as string) === "NO_DATA") return "#e9ecef"; // Gray / No data recorded
    if (slot.status === "DOWN" || slot.uptimePercentage < 80) return "#dc3545"; // Red
    if (slot.status === "DEGRADED" || slot.uptimePercentage < 98)
      return "#ffc107"; // Yellow/Orange
    return "#198754"; // Green
  };

  return (
    <div className="w-100 my-2">
      <div className="d-flex align-items-center justify-content-between mb-1 small text-muted">
        <span>{days} days ago</span>
        <span className="fw-semibold text-dark">
          {hasRecordedData
            ? `${uptimePercentage.toFixed(2)} % uptime`
            : "No telemetry history"}
        </span>
        <span>Today</span>
      </div>

      <div
        className="d-flex align-items-stretch rounded overflow-hidden"
        style={{ height: "24px", gap: "2px", background: "transparent" }}
      >
        {slots.map((slot, index) => {
          const dateStr = new Date(slot.timestamp).toLocaleDateString(
            undefined,
            {
              month: "short",
              day: "numeric",
            },
          );
          const tooltipContent = (
            <Tooltip id={`slot-${index}`}>
              <div className="text-start">
                <strong>{dateStr}</strong>
                <div>
                  Status: <span className="fw-bold">{slot.status}</span>
                </div>
                <div>Uptime: {slot.uptimePercentage}%</div>
                {slot.responseTimeMs > 0 && (
                  <div>Latency: {slot.responseTimeMs}ms</div>
                )}
              </div>
            </Tooltip>
          );

          return (
            <OverlayTrigger
              key={slot.timestamp}
              placement="top"
              overlay={tooltipContent}
            >
              <div
                style={{
                  flex: 1,
                  backgroundColor: getSlotColor(slot),
                  borderRadius: "2px",
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
                className="uptime-bar-slot hover-opacity"
              />
            </OverlayTrigger>
          );
        })}
      </div>
    </div>
  );
};
