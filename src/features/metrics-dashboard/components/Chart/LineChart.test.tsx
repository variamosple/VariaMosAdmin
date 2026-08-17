import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { Metric, MetricData } from "../../domain/Entity/Metric";
import { LineChart } from "./LineChart";

// Mock the ChartContext hook and wrapper
const mockUseChartContext = {
  metric: {
    id: "project-signups",
    chartType: "line",
    defaultFilter: "all",
    title: "Project Signups",
    data: null as MetricData | null,
  },
  isLoading: false,
};

vi.mock("../../context/ChartContext", async () => ({
  useChartContext: () => mockUseChartContext,
  withChartContextWrapper:
    <P extends object>(Component: React.ComponentType<P>) =>
    (props: P) => <Component {...props} />,
}));

// Mock the useLineChartData hook
const mockUseLineChartData = {
  data: [
    ["Date", "Signups"],
    ["2026-07-01", 10],
    ["2026-07-02", 15],
  ],
  options: { title: "Daily Signups" },
};

vi.mock("../../hooks/useLineChartData", async () => ({
  useLineChartData: () => mockUseLineChartData,
}));

// Mock recharts to avoid JSDOM charting errors
vi.mock("recharts", async () => {
  const OriginalModule = await vi.importActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    LineChart: ({
      children,
      data,
    }: {
      children: React.ReactNode;
      data?: Record<string, string | number>[];
    }) => (
      <div
        data-testid="mock-recharts-line-chart"
        data-rows-count={data ? data.length : 0}
      >
        LineChart: Rows: {data ? data.length : 0}
        {children}
      </div>
    ),
    Line: () => <div data-testid="mock-recharts-line" />,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

// Mock ChartDateFilter component
vi.mock("./ChartDateFilter", async () => ({
  ChartDateFilter: ({ id }: { id: string }) => (
    <div data-testid="mock-date-filter">Filter: {id}</div>
  ),
}));

describe("LineChart Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChartContext.metric = {
      id: "project-signups",
      chartType: "line",
      defaultFilter: "all",
      title: "Project Signups",
      data: null,
    };
    mockUseChartContext.isLoading = false;
  });

  const dummyMetric: Metric = {
    id: "dummy-metric",
    chartType: "line",
    defaultFilter: "all",
    title: "Project Signups",
    data: null,
  };

  it("renders the title and date filter", () => {
    render(<LineChart metric={dummyMetric} />);

    expect(screen.getByText("Project Signups")).toBeInTheDocument();
    expect(screen.getByTestId("mock-date-filter")).toHaveTextContent(
      "Filter: Project Signups",
    );
  });

  it("shows Spinner when isLoading is true", () => {
    mockUseChartContext.isLoading = true;
    render(<LineChart metric={dummyMetric} />);

    // Should not show chart or empty state
    expect(
      screen.queryByTestId("mock-recharts-line-chart"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No data found.")).not.toBeInTheDocument();

    // Check loading indicator
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders 'No data found.' if metric has no data and not loading", () => {
    mockUseChartContext.isLoading = false;
    mockUseChartContext.metric.data = null;
    render(<LineChart metric={dummyMetric} />);

    expect(screen.getByText("No data found.")).toBeInTheDocument();
    expect(
      screen.queryByTestId("mock-recharts-line-chart"),
    ).not.toBeInTheDocument();
  });

  it("renders the Recharts LineChart when metric has data", () => {
    mockUseChartContext.isLoading = false;
    mockUseChartContext.metric.data = [];
    render(<LineChart metric={dummyMetric} />);

    expect(screen.queryByText("No data found.")).not.toBeInTheDocument();
    const chart = screen.getByTestId("mock-recharts-line-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute("data-rows-count", "2");
  });
});
