export interface ChartDataItem {
  count: number;
  [key: string]: string | number;
}

export type GeoChartData = Record<string, [string, number][]>;

export type MetricData = ChartDataItem[] | GeoChartData;

export interface Metric {
  id: string;
  title: string;
  chartType: string;
  defaultFilter: string;
  filters?: string[];
  labelKey?: string;
  data?: MetricData | null;
}
