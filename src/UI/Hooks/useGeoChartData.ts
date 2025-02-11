import { Metric } from "@/Domain/Metric/Metric";
import { useMemo, useState } from "react";

export const useGeoChartData = (metric: Metric) => {
  const [activeFilter, setFilter] = useState(metric.defaultFilter);

  const filterOptions: string[] = useMemo(
    () => Object.keys(metric.data) || [],
    [metric.data]
  );

  const options = useMemo(
    () => ({
      region: "world",
      colorAxis: {
        colors: ["#89B3E0", "#4995d8", "#1C5C9E"],
      },
    }),
    []
  );

  const data = useMemo(() => {
    return [
      ["Country", "Visits"],
      ...((metric.data as any)[activeFilter] || []),
    ];
  }, [activeFilter, metric]);

  return { activeFilter, setFilter, options, data, filterOptions };
};
