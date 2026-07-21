import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LineChart } from "./LineChart";
// Mock the ChartContext hook and wrapper
const mockUseChartContext = {
  metric: {
    title: "Project Signups",
    data: null as any,
  },
  isLoading: false,
};

jest.mock("../../context/ChartContext", () => ({
  useChartContext: () => mockUseChartContext,
  withChartContextWrapper: (Component: any) => (props: any) => <Component {...props} />,
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

jest.mock("../../hooks/useLineChartData", () => ({
  useLineChartData: () => mockUseLineChartData,
}));

// Mock react-google-charts to avoid JSDOM charting errors
jest.mock("react-google-charts", () => ({
  __esModule: true,
  default: ({ chartType, data }: any) => (
    <div data-testid="mock-google-chart" data-chart-type={chartType}>
      Chart Type: {chartType}, Rows: {data ? data.length - 1 : 0}
    </div>
  ),
}));

// Mock ChartDateFilter component
jest.mock("./ChartDateFilter", () => ({
  ChartDateFilter: ({ id }: any) => <div data-testid="mock-date-filter">Filter: {id}</div>,
}));

describe("LineChart Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartContext.metric = {
      title: "Project Signups",
      data: null,
    };
    mockUseChartContext.isLoading = false;
  });

  const dummyMetric: any = {
    title: "Project Signups",
    data: null,
  };

  it("renders the title and date filter", () => {
    render(<LineChart metric={dummyMetric} />);

    expect(screen.getByText("Project Signups")).toBeInTheDocument();
    expect(screen.getByTestId("mock-date-filter")).toHaveTextContent("Filter: Project Signups");
  });

  it("shows Spinner when isLoading is true", () => {
    mockUseChartContext.isLoading = true;
    render(<LineChart metric={dummyMetric} />);

    // Should not show chart or empty state
    expect(screen.queryByTestId("mock-google-chart")).not.toBeInTheDocument();
    expect(screen.queryByText("No data found.")).not.toBeInTheDocument();

    // Check loading indicator
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders 'No data found.' if metric has no data and not loading", () => {
    mockUseChartContext.isLoading = false;
    mockUseChartContext.metric.data = null;
    render(<LineChart metric={dummyMetric} />);

    expect(screen.getByText("No data found.")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-google-chart")).not.toBeInTheDocument();
  });

  it("renders the Google Chart when metric has data", () => {
    mockUseChartContext.isLoading = false;
    mockUseChartContext.metric.data = { some: "data" };
    render(<LineChart metric={dummyMetric} />);

    expect(screen.queryByText("No data found.")).not.toBeInTheDocument();
    const chart = screen.getByTestId("mock-google-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute("data-chart-type", "LineChart");
    expect(chart).toHaveTextContent("Rows: 2");
  });
});
