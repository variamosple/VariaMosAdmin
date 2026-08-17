import { useMemo, useState } from "react";
import type { GeoChartData, Metric } from "../domain/Entity/Metric";

export const useGeoChartData = (metric: Metric) => {
  const [activeFilter, setFilter] = useState(metric.defaultFilter);

  const filterOptions: string[] = useMemo(
    () => Object.keys(metric.data || {}) || [],
    [metric.data],
  );

  const options = useMemo(
    () => ({
      region: "world",
      colorAxis: {
        colors: ["#89B3E0", "#4995d8", "#1C5C9E"],
      },
    }),
    [],
  );

  const data = useMemo(() => {
    const geoData = metric?.data as GeoChartData | undefined;
    return [["Country", "Visits"], ...(geoData?.[activeFilter] || [])];
  }, [activeFilter, metric]);

  return { activeFilter, setFilter, options, data, filterOptions };
};
