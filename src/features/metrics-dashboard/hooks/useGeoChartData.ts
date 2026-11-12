import { useMemo, useState } from "react";
import type { Metric } from "../domain/Entity/Metric";

export const useGeoChartData = (metric: Metric) => {
  const [activeFilter, setFilter] = useState(metric.defaultFilter);

  const filterOptions: string[] = useMemo(
    () => Object.keys(metric.data ?? {}),
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
    // The geographic data is the object form; the other charts get a list
    const geoData = Array.isArray(metric?.data) ? undefined : metric?.data;
    return [["Country", "Visits"], ...(geoData?.[activeFilter] || [])];
  }, [activeFilter, metric]);

  return { activeFilter, setFilter, options, data, filterOptions };
};
