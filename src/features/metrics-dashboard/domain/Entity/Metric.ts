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
