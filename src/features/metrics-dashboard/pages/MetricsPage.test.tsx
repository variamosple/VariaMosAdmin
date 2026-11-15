import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { server } from "@/shared/tests/mocks/server";
import { MetricsPage } from "./MetricsPage";

vi.mock("@variamosple/variamos-components", async () => ({
  withPageVisit: <T,>(component: T): T => component,
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
}));

// The charts are drawn by Recharts, which needs a real layout
vi.mock("../components/TimeSeriesChart", () => ({
  TimeSeriesChart: ({ metric }: { metric: { title: string } }) => (
    <div data-testid="time-chart">{metric.title}</div>
  ),
}));
vi.mock("../components/RankingChart", () => ({
  RankingChart: ({ metric }: { metric: { title: string } }) => (
    <div data-testid="ranking-chart">{metric.title}</div>
  ),
}));

const METRICS = [
  {
    id: "overview",
    title: "Overview",
    chartType: "kpi",
    defaultFilter: "key",
    data: [
      {
        key: "visits",
        label: "Visits",
        unit: "count",
        count: 120,
        previous: 100,
      },
      {
        key: "failed_sign_ins",
        label: "Failed sign-ins",
        unit: "count",
        count: 4,
        previous: 2,
      },
    ],
  },
  {
    id: "content_overview",
    title: "On the platform today",
    chartType: "kpi",
    defaultFilter: "key",
    data: [{ key: "projects", label: "Projects", unit: "count", count: 671 }],
  },
  {
    id: "visits_over_time",
    title: "Visits and visitors",
    chartType: "line",
    defaultFilter: "series",
    data: [],
  },
  {
    id: "top_visited_pages",
    title: "Most visited pages",
    chartType: "ranking",
    defaultFilter: "page",
    data: [],
  },
];

describe("MetricsPage", () => {
  it("reads the last 30 days, then the period chosen, for the whole page", async () => {
    const asked: URLSearchParams[] = [];
    server.use(
      http.get("*/v1/metrics", ({ request }) => {
        asked.push(new URL(request.url).searchParams);
        return HttpResponse.json({ data: METRICS });
      }),
    );

    render(<MetricsPage />);

    expect(await screen.findByText("Over the period")).toBeInTheDocument();
    expect(screen.getByTestId("figure-visits")).toHaveTextContent("120");
    expect(screen.getByTestId("figure-visits")).toHaveTextContent(
      "+20 % vs previous period",
    );
    // More failed sign-ins is worse
    expect(screen.getByText("+100 % vs previous period")).toHaveClass(
      "text-danger",
    );
    expect(screen.getByText("On the platform today")).toBeInTheDocument();
    expect(screen.getByTestId("time-chart")).toHaveTextContent(
      "Visits and visitors",
    );
    expect(screen.getByTestId("ranking-chart")).toHaveTextContent(
      "Most visited pages",
    );

    const [first] = asked;
    const days =
      (Date.parse(String(first?.get("endDate"))) -
        Date.parse(String(first?.get("startDate")))) /
      86_400_000;
    expect(days).toBe(29);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "12 months" }));
    await waitFor(() => expect(asked).toHaveLength(2));
    expect(screen.getByRole("button", { name: "12 months" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("says why the statistics are missing, and reads them again on retry", async () => {
    let calls = 0;
    server.use(
      http.get("*/v1/metrics", () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { errorCode: 500, message: "Internal server error" },
              { status: 500 },
            )
          : HttpResponse.json({ data: METRICS });
      }),
    );

    render(<MetricsPage />);

    const retry = await screen.findByRole("button", { name: "Retry" });
    await userEvent.setup().click(retry);
    expect(await screen.findByText("Over the period")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});
