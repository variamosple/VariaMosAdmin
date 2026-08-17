import { useMemo, useState } from "react";
import type { ChartDataItem, Metric } from "../domain/Entity/Metric";

export const useChart = (metric: Metric) => {
  const [activeFilter, setFilter] = useState(metric.defaultFilter);

  const options = useMemo(
    () => ({
      pieHole: metric.chartType === "doughnut" ? 0.3 : 0,
      is3D: false,
      chartArea: { top: 10, height: "80%", width: "80%" },
    }),
    [metric],
  );

  const data = useMemo(() => {
    const metricData = (metric.data as ChartDataItem[]) || [];
    const labelKey = metric.labelKey;

    if (!labelKey) {
      return [["Page", "Visits"]];
    }

    const dataset = metricData.map((item) => [item[labelKey], item.count]);

    return [["Page", "Visits"], ...dataset];
  }, [metric]);

  return { activeFilter, setFilter, options, data };
};
