export interface Metric {
  id: string;
  title: string;
  chartType: string;
  defaultFilter: string;
  filters?: string[];
  labelKey?: string;
  data?: any;
}
