import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import type { Metric } from "../domain/Entity/Metric";
import { ChartContextProvider, useChartContext } from "./ChartContext";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

vi.mock("@variamosple/variamos-components", async () => {
  return {
    ResponseModel: class ResponseModel<T> {
      errorCode?: number;
      message?: string;
      data?: T;
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

const mockPushToast = vi.fn();
vi.mock("@/shared/context/ToastContext", async () => ({
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
      <button
        type="button"
        onClick={() =>
          filterChartData({ fromDate: "2026-01-01", toDate: "2026-01-10" })
        }
      >
        Filter
      </button>
    </div>
  );
};

describe("ChartContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when useChartContext is used outside ChartContextProvider", () => {
    // Suppress console.error in vi output for this test block
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Intercept and prevent JSDOM from logging the expected uncaught error
    const errorHandler = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes(
          "useChartContext must be used within a ChartContextProvider",
        )
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("error", errorHandler);

    expect(() => renderHook(() => useChartContext())).toThrow(
      "useChartContext must be used within a ChartContextProvider",
    );

    window.removeEventListener("error", errorHandler);
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
    const updatedMetric: Metric = {
      ...mockMetric,
      title: "Updated Visits Chart",
    };
    let queryMetricParams = null as URLSearchParams | null;

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
      expect(screen.getByTestId("title").textContent).toBe(
        "Updated Visits Chart",
      );
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
