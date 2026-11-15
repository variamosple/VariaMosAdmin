interface ChartDataItem {
  count: number;
  [key: string]: string | number;
}

type GeoChartData = Record<string, [string, number][]>;

type MetricData = ChartDataItem[] | GeoChartData;

export interface Metric {
  id: string;
  title: string;
  chartType: string;
  defaultFilter: string;
  filters?: string[];
  labelKey?: string;
  data?: MetricData | null;
}

/** The rows of a chart drawn from a list; none for the geographic form. */
const chartItemsOf = (metric: Metric): ChartDataItem[] =>
  Array.isArray(metric.data) ? metric.data : [];

/** A key figure of the page, with the one of the period just before. */
export interface KeyFigure {
  key: string;
  label: string;
  unit: "count" | "percent" | "decimal";
  count: number | null;
  previous?: number | null;
}

const isKeyFigure = (item: ChartDataItem): item is ChartDataItem & KeyFigure =>
  typeof item.key === "string" &&
  typeof item.label === "string" &&
  typeof item.unit === "string";

export const keyFiguresOf = (metric: Metric | undefined): KeyFigure[] =>
  metric ? chartItemsOf(metric).filter(isKeyFigure) : [];

/** One step of a chart over time: its date and a value for each series. */
export interface TimePoint {
  date: string;
  [series: string]: string | number;
}

/**
 * Rows of (series, count, date) as the database gives them, one row per
 * date with a column per series, in the order the series first appear.
 */
export const timeSeriesOf = (
  metric: Metric,
): { series: string[]; points: TimePoint[] } => {
  const series: string[] = [];
  const byDate = new Map<string, TimePoint>();
  for (const item of chartItemsOf(metric)) {
    const name = String(item.series);
    const date = String(item.date);
    if (!series.includes(name)) series.push(name);
    const point = byDate.get(date) ?? { date };
    point[name] = item.count;
    byDate.set(date, point);
  }
  return { series, points: [...byDate.values()] };
};

/** Rows of a ranking: a label (the labelKey column) and a count. */
export const rankingOf = (
  metric: Metric,
): { label: string; count: number }[] => {
  const labelKey = metric.labelKey ?? "label";
  return chartItemsOf(metric).map((item) => ({
    label: String(item[labelKey]),
    count: item.count,
  }));
};

/** The days of the sign-ins grid, ISO order: 1 is Monday. */
export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** The sign-ins grid: a count per day (Monday first) and hour (0 to 23). */
export interface HourGrid {
  counts: number[][];
  max: number;
  total: number;
}

/**
 * Rows of (day, hour, count) as the database gives them, as 7 rows of 24
 * hours; a missing cell counts 0, a cell out of the week is left out.
 */
export const hourGridOf = (metric: Metric): HourGrid => {
  const counts = WEEK_DAYS.map(() => Array.from({ length: 24 }, () => 0));
  for (const item of chartItemsOf(metric)) {
    const day = Number(item.day);
    const hour = Number(item.hour);
    const row = counts[day - 1];
    if (row && Number.isInteger(hour) && hour >= 0 && hour < 24) {
      row[hour] = item.count;
    }
  }
  const all = counts.flat();
  return {
    counts,
    max: Math.max(0, ...all),
    total: all.reduce((sum, count) => sum + count, 0),
  };
};
