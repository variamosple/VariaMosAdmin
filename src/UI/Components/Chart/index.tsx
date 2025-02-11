import { Metric } from "@/Domain/Metric/Metric";
import { FC } from "react";
import { GeoChart } from "./GeoChart";
import { LineChart } from "./LineChart";
import { PieChart } from "./PieChart";

export interface ChartComponentProps {
  metric: Metric;
}

export const ChartComponent: FC<ChartComponentProps> = ({ metric }) => {
  if (metric.chartType === "geo") {
    return <GeoChart metric={metric} />;
  }

  if (["pie", "doughnut"].includes(metric.chartType)) {
    return <PieChart metric={metric} />;
  }

  if (metric.chartType === "line") {
    return <LineChart metric={metric} />;
  }

  return null;
};
