import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/shared/tests/mocks/server";
import { MetricsPage } from "./MetricsPage";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  return {
    withPageVisit: (component: any) => component,
    PagedModel: class PagedModel {},
    ResponseModel: class ResponseModel {
      type: string;
      errorCode?: number;
      message?: string;
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

// Mock react-bootstrap Spinner to have a reliable test ID
vi.mock("react-bootstrap", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-bootstrap")>();
  return {
    ...original,
    Spinner: () => <div data-testid="loading-spinner">Spinner</div>,
  };
});

// Mock ChartComponent to avoid complex sub-renders
vi.mock("../components/Chart", async () => ({
  ChartComponent: ({ metric }: any) => (
    <div data-testid="chart-comp">{metric.title}</div>
  ),
}));

describe("MetricsPage", () => {
  it("renders the spinner while metrics are loading, then displays chart components", async () => {
    server.use(
      http.get("*/v1/metrics", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return HttpResponse.json({
          data: [
            { title: "Metric One", type: "line" },
            { title: "Metric Two", type: "geo" },
          ],
        });
      }),
    );

    render(<MetricsPage />);

    // Assert spinner is shown (uses findByTestId to wait for useEffect state update to flush)
    const spinner = await screen.findByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();

    // Assert spinner disappears and charts render
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).toBeNull();
    });

    expect(screen.getByText("Metric One")).toBeInTheDocument();
    expect(screen.getByText("Metric Two")).toBeInTheDocument();
    expect(screen.getAllByTestId("chart-comp")).toHaveLength(2);
  });
});
