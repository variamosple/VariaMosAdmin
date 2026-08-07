import React from "react";
import { render, screen } from "@testing-library/react";
import { ChartComponent } from "./index";
import { Metric } from "../../domain/Entity/Metric";

// Mock google charts to prevent errors during rendering in test environment
vi.mock("react-google-charts", async () => {
  return {
    Chart: () => <div data-testid="google-chart">Mock Google Chart</div>,
  };
});

// Mock the context wrapper so line chart doesn't throw
vi.mock("../../context/ChartContext", async () => {
  return {
    useChartContext: () => ({
      metric: { title: "Test Line Metric", data: [] },
      isLoading: false,
    }),
    withChartContextWrapper: (Component: any) => Component,
  };
});

describe("ChartComponent Component", () => {
  it("renders GeoChart when chartType is geo", () => {
    const geoMetric: Metric = {
      id: "geo-metric",
      title: "Geo Metric",
      chartType: "geo",
      defaultFilter: "all",
      labelKey: "country",
      data: { all: [["US", 10]] },
    };

    render(<ChartComponent metric={geoMetric} />);
    expect(screen.getAllByTestId("google-chart")).toHaveLength(1);
  });

  it("renders PieChart when chartType is pie", () => {
    const pieMetric: Metric = {
      id: "pie-metric",
      title: "Pie Metric",
      chartType: "pie",
      defaultFilter: "all",
      labelKey: "page",
      data: [{ page: "Home", count: 10 }],
    };

    render(<ChartComponent metric={pieMetric} />);
    expect(screen.getAllByTestId("google-chart")).toHaveLength(1);
  });
});
