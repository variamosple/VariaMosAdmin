import type { FC } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeriodStep } from "../domain/Entity/ChartPeriod";
import { stepLabel } from "../domain/Entity/formatFigures";
import { type Metric, timeSeriesOf } from "../domain/Entity/Metric";
import { ChartCard } from "./ChartCard";

// Bootstrap's blue, orange and green; a failure is red
const PALETTE = ["#0d6efd", "#fd7e14", "#198754"];
const colorOf = (series: string, index: number) =>
  series === "Failed"
    ? "#dc3545"
    : (PALETTE[index % PALETTE.length] ?? "#0d6efd");

const NOTES: Record<string, string> = {
  visits_over_time: "Visitors are distinct accounts.",
  activity_over_time:
    "An account that visited, signed in or changed a project; a project changed or saved.",
  sign_ins: "Successful sign-ins by method, and failed attempts.",
};

export interface TimeSeriesChartProps {
  metric: Metric;
  step: PeriodStep;
}

/** A chart over the period: lines, or stacked bars for counts of events. */
export const TimeSeriesChart: FC<TimeSeriesChartProps> = ({ metric, step }) => {
  const { series, points } = timeSeriesOf(metric);
  const asBars = metric.chartType === "bar";
  const Chart = asBars ? BarChart : LineChart;

  return (
    <ChartCard
      title={metric.title}
      note={NOTES[metric.id]}
      isEmpty={points.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <Chart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(date: string) => stepLabel(date, step)}
            tick={{ fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={40} />
          <Tooltip labelFormatter={(date) => stepLabel(String(date), step)} />
          {/* In the order of the series, not alphabetical */}
          <Legend verticalAlign="top" height={28} itemSorter={null} />
          {series.map((name, index) =>
            asBars ? (
              <Bar
                key={name}
                dataKey={name}
                stackId="events"
                fill={colorOf(name, index)}
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={name}
                dataKey={name}
                type="linear"
                stroke={colorOf(name, index)}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
