import { Metric } from "@/Domain/Metric/Metric";
import { useMemo, useState } from "react";

export interface ChartAxist {
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
        // slantedText: true,
        // slantedTextAngle: 90,
      },
      vAxis: {
        title: "Visits",
      },
      chartArea: { top: 20 },
      legend: { maxLines: 3 },
      focusTarget: "category",
      tooltip: { trigger: "focus" },
    }),
    []
  );

  const { xAxis, yAxis }: ChartAxist = useMemo(() => {
    const x = new Set<string>();
    const y = new Set<string>();

    metric.data.forEach((item: any) => {
      x.add(item[metric.labelKey!]);
      y.add(item[metric.defaultFilter]);
    });

    return { xAxis: Array.from(x), yAxis: Array.from(y) };
  }, [metric]);

  const data = useMemo(() => {
    const groupedData: Map<string, any> = metric.data.reduce(
      (acc: Map<string, any[]>, item: any) => {
        const key = item[activeFilter];

        const element: any = acc.get(key) || {};
        element[item[metric.labelKey!]] = item.count;

        acc.set(key, element);

        return acc;
      },
      new Map<string, any[]>()
    );

    const columns = ["Date", ...yAxis];

    const rows: any[][] = xAxis.map((x: string) => {
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
