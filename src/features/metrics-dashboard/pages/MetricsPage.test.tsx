import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MetricsPage } from "./MetricsPage";
import { queryMetrics } from "../api/MetricsRepository";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  return {
    withPageVisit: (component: any) => component,
    PagedModel: class PagedModel {},
    ResponseModel: class ResponseModel {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };
});

// Mock queryMetrics repository call
jest.mock("../api/MetricsRepository", () => ({
  queryMetrics: jest.fn(),
}));

// Mock react-bootstrap Spinner to have a reliable test ID
jest.mock("react-bootstrap", () => {
  const original = jest.requireActual("react-bootstrap");
  return {
    ...original,
    Spinner: () => <div data-testid="loading-spinner">Spinner</div>,
  };
});

// Mock ChartComponent to avoid complex sub-renders
jest.mock("../components/Chart", () => ({
  ChartComponent: ({ metric }: any) => <div data-testid="chart-comp">{metric.title}</div>,
}));

describe("MetricsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the spinner while metrics are loading, then displays chart components", async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (queryMetrics as jest.Mock).mockReturnValue(promise);

    render(<MetricsPage />);

    // Assert spinner is shown (uses findByTestId to wait for useEffect state update to flush)
    const spinner = await screen.findByTestId("loading-spinner");
    expect(spinner).toBeDefined();

    // Resolve API promise
    resolvePromise({
      data: [
        { title: "Metric One", type: "line" },
        { title: "Metric Two", type: "geo" },
      ],
    });

    // Assert spinner disappears and charts render
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).toBeNull();
    });

    expect(screen.getByText("Metric One")).toBeDefined();
    expect(screen.getByText("Metric Two")).toBeDefined();
    expect(screen.getAllByTestId("chart-comp")).toHaveLength(2);
  });
});
