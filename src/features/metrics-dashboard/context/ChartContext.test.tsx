import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ChartContextProvider, useChartContext } from "./ChartContext";
import { Metric } from "../domain/Entity/Metric";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

jest.mock("@variamosple/variamos-components", () => {
  return {
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
  };
});

const mockPushToast = jest.fn();
jest.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({
    pushToast: mockPushToast,
  }),
}));

const mockMetric: Metric = {
  id: "metric-1",
  title: "Visits Chart",
  chartType: "line",
  defaultFilter: "all",
  labelKey: "date",
  data: [],
};

const TestComponent = () => {
  const { metric, chartFilter, isLoading, filterChartData } = useChartContext();
  return (
    <div>
      <span data-testid="title">{metric.title}</span>
      <span data-testid="loading">{isLoading ? "loading" : "idle"}</span>
      <span data-testid="filter-from">{chartFilter.fromDate}</span>
      <button onClick={() => filterChartData({ fromDate: "2026-01-01", toDate: "2026-01-10" })}>
        Filter
      </button>
    </div>
  );
};

describe("ChartContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error when useChartContext is used outside ChartContextProvider", () => {
    // Suppress console.error in jest output for this test block
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      "useChartContext must be used within a ChartContextProvider",
    );
    spy.mockRestore();
  });

  it("should initialize and render context values correctly", () => {
    render(
      <ChartContextProvider metric={mockMetric}>
        <TestComponent />
      </ChartContextProvider>,
    );

    expect(screen.getByTestId("title").textContent).toBe("Visits Chart");
    expect(screen.getByTestId("loading").textContent).toBe("idle");
    expect(screen.getByTestId("filter-from").textContent).toBe("");
  });

  it("should filter chart data and update context metric upon successful API query", async () => {
    const updatedMetric: Metric = { ...mockMetric, title: "Updated Visits Chart" };
    let queryMetricParams: any = null;

    server.use(
      http.get(apiTarget("/v1/metrics/:metricId"), ({ request }) => {
        const url = new URL(request.url);
        queryMetricParams = url.searchParams;
        return HttpResponse.json({ errorCode: null, data: updatedMetric });
      }),
    );

    render(
      <ChartContextProvider metric={mockMetric}>
        <TestComponent />
      </ChartContextProvider>,
    );

    const button = screen.getByText("Filter");
    await act(async () => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("title").textContent).toBe("Updated Visits Chart");
    });

    expect(queryMetricParams?.get("id")).toBe("metric-1");
    expect(queryMetricParams?.get("startDate")).toBe("2026-01-01");
    expect(queryMetricParams?.get("endDate")).toBe("2026-01-10");
  });

  it("should push toast notification upon error return from API query", async () => {
    server.use(
      http.get(apiTarget("/v1/metrics/:metricId"), () => {
        return HttpResponse.json({
          errorCode: 500,
          message: "API error message",
        });
      }),
    );

    render(
      <ChartContextProvider metric={mockMetric}>
        <TestComponent />
      </ChartContextProvider>,
    );

    const button = screen.getByText("Filter");
    await act(async () => {
      button.click();
    });

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith({
        title: "Error",
        message: "API error message",
        variant: "danger",
      });
    });
  });
});
