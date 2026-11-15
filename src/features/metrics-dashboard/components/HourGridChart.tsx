import type { FC } from "react";
import { hourGridOf, type Metric, WEEK_DAYS } from "../domain/Entity/Metric";
import { ChartCard } from "./ChartCard";

// One hue, light to dark (Bootstrap blue 100, 300, 500, 700); no sign-in
// stays the neutral of the page
const EMPTY = "var(--bs-tertiary-bg)";
const STEPS = ["#cfe2ff", "#6ea8fe", "#0d6efd", "#084298"];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
// Hours labelled under the grid; the others only for screen readers
const SHOWN_HOURS = new Set([0, 6, 12, 18]);

/** The step of a count: 0 for none, then 1 to 4 by quarter of the busiest. */
export const stepOf = (count: number, max: number): number =>
  count <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((4 * count) / max));

const colorOf = (count: number, max: number): string => {
  const step = stepOf(count, max);
  return step === 0 ? EMPTY : (STEPS[step - 1] ?? EMPTY);
};

const hourText = (hour: number) =>
  `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;

const signIns = (count: number) => `${count} sign-in${count === 1 ? "" : "s"}`;

export interface HourGridChartProps {
  metric: Metric;
}

/**
 * Sign-ins by day of the week and hour, as a table: each cell is coloured
 * by its count and says it on hover and to screen readers.
 */
export const HourGridChart: FC<HourGridChartProps> = ({ metric }) => {
  const grid = hourGridOf(metric);
  let busiest = { day: 0, hour: 0, count: 0 };
  grid.counts.forEach((row, day) => {
    row.forEach((count, hour) => {
      if (count > busiest.count) busiest = { day, hour, count };
    });
  });

  return (
    <ChartCard
      title={metric.title}
      note="Successful sign-ins, by password or Google, in the hour they started."
      isEmpty={grid.total === 0}
    >
      <p className="small mb-2">
        Busiest: {WEEK_DAYS[busiest.day]}, {hourText(busiest.hour)} (
        {signIns(busiest.count)}).
      </p>
      <table
        className="w-100"
        style={{
          tableLayout: "fixed",
          borderCollapse: "separate",
          borderSpacing: 2,
        }}
      >
        <caption className="visually-hidden">
          {metric.title}: sign-ins for each day of the week and hour.
        </caption>
        <thead className="visually-hidden">
          <tr>
            <th scope="col">Day</th>
            {HOURS.map((hour) => (
              <th key={hour} scope="col">
                {hourText(hour)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.counts.map((row, day) => (
            <tr key={WEEK_DAYS[day]}>
              <th
                scope="row"
                className="small fw-normal text-muted pe-1"
                style={{ width: 36 }}
              >
                <abbr title={WEEK_DAYS[day]} className="text-decoration-none">
                  {WEEK_DAYS[day]?.slice(0, 3)}
                </abbr>
              </th>
              {row.map((count, hour) => (
                <td
                  key={HOURS[hour]}
                  title={`${WEEK_DAYS[day]}, ${hourText(hour)}: ${signIns(count)}`}
                  className="rounded-1 p-0"
                  style={{ height: 20, background: colorOf(count, grid.max) }}
                  data-testid={`cell-${day + 1}-${hour}`}
                >
                  <span className="visually-hidden">{count}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot aria-hidden="true">
          <tr>
            <td />
            {HOURS.map((hour) => (
              <td
                key={hour}
                className="small text-muted text-start text-nowrap"
              >
                {SHOWN_HOURS.has(hour) ? `${hour}h` : ""}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      <div className="d-flex align-items-center gap-1 small text-muted mt-2">
        <span className="me-1">Fewer</span>
        {[EMPTY, ...STEPS].map((color) => (
          <span
            key={color}
            aria-hidden="true"
            className="d-inline-block rounded-1"
            style={{ width: 14, height: 14, background: color }}
          />
        ))}
        <span className="ms-1">More (busiest hour: {grid.max})</span>
      </div>
    </ChartCard>
  );
};
