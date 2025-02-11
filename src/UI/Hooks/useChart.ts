import { Metric } from "@/Domain/Metric/Metric";
import { useMemo, useState } from "react";

export const useChart = (metric: Metric) => {
  const [activeFilter, setFilter] = useState(metric.defaultFilter);

  const options = useMemo(
    () => ({
      pieHole: metric.chartType === "doughnut" ? 0.3 : 0,
      is3D: false,
      chartArea: { top: 10, height: "80%", width: "80%" },
    }),
    [metric]
  );

  const data = useMemo(() => {
    const metricData = metric.data || [];

    const dataset = metricData.map((item: any) => [
      item[metric.labelKey!],
      item.count,
    ]);

    return [["Page", "Visits"], ...dataset];
  }, [metric]);

  return { activeFilter, setFilter, options, data };
};
