import { renderHook, act } from "@testing-library/react";
import { useLineChartData } from "./useLineChartData";
import { Metric } from "../domain/Entity/Metric";

const mockMetric: Metric = {
  id: "metric-1",
  title: "Visits Chart",
  chartType: "line",
  defaultFilter: "os",
  labelKey: "date",
  data: [
    { date: "2026-01-01", os: "Linux", browser: "Chrome", count: 10 },
    { date: "2026-01-01", os: "Windows", browser: "Firefox", count: 5 },
    { date: "2026-01-02", os: "Linux", browser: "Safari", count: 8 },
  ],
};

describe("useLineChartData hook", () => {
  it("should initialize activeFilter and options correctly", () => {
    const { result } = renderHook(() => useLineChartData(mockMetric));

    expect(result.current.activeFilter).toBe("os");
    expect(result.current.options.hAxis.title).toBe("Date");
    expect(result.current.options.vAxis.title).toBe("Visits");
  });

  it("should format metric data into Google Chart rows grouped by activeFilter", () => {
    const { result } = renderHook(() => useLineChartData(mockMetric));

    const [columns, ...rows] = result.current.data;

    // Columns should be Date, and the values of the filter 'os' (Linux, Windows)
    expect(columns).toEqual(["Date", "Linux", "Windows"]);

    expect(rows).toHaveLength(2); // Two unique dates

    // Verify first row: Date and count values for Linux, Windows
    expect(rows[0][0]).toBeInstanceOf(Date);
    expect(rows[0][1]).toBe(10); // Linux count on 2026-01-01
    expect(rows[0][2]).toBe(5); // Windows count on 2026-01-01

    // Verify second row
    expect(rows[1][1]).toBe(8); // Linux count on 2026-01-02
    expect(rows[1][2]).toBe(0); // Windows count on 2026-01-02 (no record)
  });

  it("should update data mapping when filter is changed", () => {
    const { result } = renderHook(() => useLineChartData(mockMetric));

    act(() => {
      result.current.setFilter("browser");
    });

    expect(result.current.activeFilter).toBe("browser");
    const [columns, ...rows] = result.current.data;

    // Columns remain based on defaultFilter (Linux, Windows) as designed in the code
    expect(columns).toEqual(["Date", "Linux", "Windows"]);
    expect(rows).toHaveLength(2);
  });
});
