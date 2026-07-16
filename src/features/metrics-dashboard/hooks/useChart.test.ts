import { renderHook } from "@testing-library/react";
import { useChart } from "./useChart";
import { Metric } from "../domain/Entity/Metric";

const mockMetric: Metric = {
  id: "test-metric",
  title: "Test Metric",
  chartType: "pie",
  defaultFilter: "all",
  labelKey: "page",
  data: [
    { page: "Home", count: 10 },
    { page: "Details", count: 5 },
  ],
};

describe("useChart Hook", () => {
  it("should initialize options and process data for Google Charts", () => {
    const { result } = renderHook(() => useChart(mockMetric));

    expect(result.current.activeFilter).toBe("all");
    expect(result.current.options).toEqual({
      pieHole: 0,
      is3D: false,
      chartArea: { top: 10, height: "80%", width: "80%" },
    });
    expect(result.current.data).toEqual([
      ["Page", "Visits"],
      ["Home", 10],
      ["Details", 5],
    ]);
  });

  it("should handle doughnut chart type pieHole options", () => {
    const doughnutMetric: Metric = {
      ...mockMetric,
      chartType: "doughnut",
    };
    const { result } = renderHook(() => useChart(doughnutMetric));

    expect(result.current.options.pieHole).toBe(0.3);
  });
});
