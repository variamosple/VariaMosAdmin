import { render, screen } from "@testing-library/react";
import type { Metric } from "../../domain/Entity/Metric";
import { ChartComponent } from "./index";

// Mock recharts and react-svg-worldmap to prevent errors during rendering in test environment
vi.mock("react-svg-worldmap", async () => {
  return {
    WorldMap: () => <div data-testid="mock-world-map">Mock World Map</div>,
  };
});

vi.mock("recharts", async () => {
  const OriginalModule = await vi.importActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-pie-chart">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-bar-chart">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-line-chart">{children}</div>
    ),
  };
});

// Mock the context wrapper so line chart doesn't throw
vi.mock("../../context/ChartContext", async () => {
  return {
    useChartContext: () => ({
      metric: { title: "Test Line Metric", data: [] },
      isLoading: false,
    }),
    withChartContextWrapper: (Component: React.ComponentType<any>) => Component,
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
    expect(screen.getByTestId("mock-world-map")).toBeInTheDocument();
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
    expect(screen.getByTestId("recharts-pie-chart")).toBeInTheDocument();
  });
});
