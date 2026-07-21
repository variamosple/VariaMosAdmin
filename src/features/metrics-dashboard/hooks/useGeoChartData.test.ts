import { renderHook, act } from "@testing-library/react";
import { useGeoChartData } from "./useGeoChartData";
import { Metric } from "../domain/Entity/Metric";

const mockMetric: Metric = {
  id: "metric-geo",
  title: "Geo Distribution",
  chartType: "geo",
  defaultFilter: "views",
  labelKey: "country",
  data: {
    views: [
      ["France", 120],
      ["United States", 80],
    ],
    clicks: [
      ["France", 45],
      ["Canada", 30],
    ],
  },
};

describe("useGeoChartData hook", () => {
  it("should initialize filter options and activeFilter correctly", () => {
    const { result } = renderHook(() => useGeoChartData(mockMetric));

    expect(result.current.activeFilter).toBe("views");
    expect(result.current.filterOptions).toEqual(["views", "clicks"]);
    expect(result.current.options.region).toBe("world");
  });

  it("should format geo chart data for the active filter", () => {
    const { result } = renderHook(() => useGeoChartData(mockMetric));

    expect(result.current.data).toEqual([
      ["Country", "Visits"],
      ["France", 120],
      ["United States", 80],
    ]);
  });

  it("should switch data when filter selection is changed", () => {
    const { result } = renderHook(() => useGeoChartData(mockMetric));

    act(() => {
      result.current.setFilter("clicks");
    });

    expect(result.current.activeFilter).toBe("clicks");
    expect(result.current.data).toEqual([
      ["Country", "Visits"],
      ["France", 45],
      ["Canada", 30],
    ]);
  });

  it("should handle empty or missing metric data gracefully", () => {
    const emptyMetric: Metric = {
      id: "empty-geo",
      title: "No Data",
      chartType: "geo",
      defaultFilter: "views",
      labelKey: "country",
      data: null,
    };

    const { result } = renderHook(() => useGeoChartData(emptyMetric));

    expect(result.current.filterOptions).toEqual([]);
    expect(result.current.data).toEqual([["Country", "Visits"]]);
  });
});
