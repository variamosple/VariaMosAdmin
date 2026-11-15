import type { PeriodStep } from "./ChartPeriod";
import type { KeyFigure } from "./Metric";

const UTC = "UTC";

/** A step of a chart over time, as an axis label. */
export const stepLabel = (date: string, step: PeriodStep): string => {
  if (step === "month") {
    return new Date(`${date}-01T00:00:00Z`).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: UTC,
    });
  }
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: UTC,
  });
  return step === "week" ? `w/c ${day}` : day;
};

/** A day of a period, written in full. */
export const dayLabel = (date: string): string =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: UTC,
  });

/** A key figure written with its unit; none is a dash. */
export const figureText = (
  value: number | null | undefined,
  unit: KeyFigure["unit"],
) => {
  if (value === null || value === undefined) return "–";
  if (unit === "percent") return `${value} %`;
  if (unit === "decimal")
    return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
  return value.toLocaleString("en-GB");
};

export interface FigureChange {
  text: string;
  /** "up" or "down" from the period before, "flat" or none to compare. */
  direction: "up" | "down" | "flat" | "none";
}

/**
 * The change from the period before: in points for a share, in % for a
 * count; nothing to compare when there was none before.
 */
export const figureChange = ({
  count,
  previous,
  unit,
}: KeyFigure): FigureChange => {
  if (count === null || previous === null || previous === undefined) {
    return { text: "no earlier figure", direction: "none" };
  }
  const difference = count - previous;
  if (difference === 0) return { text: "no change", direction: "flat" };
  const direction = difference > 0 ? "up" : "down";
  const sign = difference > 0 ? "+" : "";
  if (unit === "percent")
    return { text: `${sign}${difference} pts`, direction };
  if (previous === 0) {
    return { text: `${sign}${difference} (none before)`, direction };
  }
  const percent = Math.round((difference / previous) * 100);
  return { text: `${sign}${percent} %`, direction };
};
