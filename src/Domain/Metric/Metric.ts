export interface Metric {
  title: string;
  chartType: string;
  defaultFilter: string;
  filters?: string[];
  labelKey?: string;
  data: any;
}
