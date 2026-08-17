import { useMemo, useState } from "react";
import type { ChartDataItem, Metric } from "../domain/Entity/Metric";

interface ChartAxes {
  xAxis: string[];
  yAxis: string[];
}

export const useLineChartData = (metric: Metric) => {
  const [activeFilter, setFilter] = useState(metric.defaultFilter);

  const options = useMemo(
    () => ({
      hAxis: {
        title: "Date",
        textStyle: {
          fontSize: 10,
        },
      },
      vAxis: {
        title: "Visits",
      },
      chartArea: { top: 20 },
      legend: { maxLines: 3 },
      focusTarget: "category",
      tooltip: { trigger: "focus" },
    }),
    [],
  );

  const { xAxis, yAxis }: ChartAxes = useMemo(() => {
    const metricData = (metric.data as ChartDataItem[]) || [];
    const x = new Set<string>();
    const y = new Set<string>();
    const labelKey = metric.labelKey;
    const defaultFilter = metric.defaultFilter;

    if (labelKey && defaultFilter) {
      for (const item of metricData) {
        const xVal = item[labelKey];
        const yVal = item[defaultFilter];
        if (xVal !== undefined) x.add(String(xVal));
        if (yVal !== undefined) y.add(String(yVal));
      }
    }

    return { xAxis: Array.from(x), yAxis: Array.from(y) };
  }, [metric]);

  const data = useMemo(() => {
    const metricData = metric.data as ChartDataItem[] | undefined;
    if (!metricData) {
      return [["Date", "Visits"]];
    }

    const labelKey = metric.labelKey;
    if (!labelKey) {
      return [["Date", "Visits"]];
    }

    const groupedData = metricData.reduce(
      (acc: Map<string, Record<string, number>>, item) => {
        const key = String(item[activeFilter]);

        const element = acc.get(key) || {};
        element[String(item[labelKey])] = item.count;

        acc.set(key, element);

        return acc;
      },
      new Map<string, Record<string, number>>(),
    );

    const columns = ["Date", ...yAxis];

    const rows: (Date | number | string)[][] = xAxis.map((x: string) => {
      const date = new Date(x);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;

      return [
        new Date(date.getTime() + userTimezoneOffset),
        ...yAxis.map((y) => groupedData.get(y)?.[x] || 0),
      ];
    });

    return [columns, ...rows];
  }, [activeFilter, metric, xAxis, yAxis]);

  return { activeFilter, setFilter, options, data };
};
