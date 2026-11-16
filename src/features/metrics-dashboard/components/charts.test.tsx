import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cloneElement, isValidElement, type ReactNode } from "react";
import type { Metric } from "../domain/Entity/Metric";
import { HourGridChart, stepOf } from "./HourGridChart";
import { KeyFigures } from "./KeyFigures";
import { PeriodPicker } from "./PeriodPicker";
import { RankingChart } from "./RankingChart";
import { TimeSeriesChart } from "./TimeSeriesChart";

// jsdom measures nothing: the charts get a fixed size
vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<typeof import("recharts")>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      isValidElement(children)
        ? cloneElement(children, { width: 800, height: 300 } as never)
        : null,
  };
});

const series = (rows: [string, number, string][]): Metric => ({
  id: "sign_ins",
  title: "Sign-ins",
  chartType: "bar",
  defaultFilter: "series",
  data: rows.map(([name, count, date]) => ({ series: name, count, date })),
});

describe("charts of the statistics page", () => {
  it("draws a chart over time with its note, and says when there is nothing", () => {
    const { rerender } = render(
      <TimeSeriesChart
        metric={series([
          ["Password", 2, "2026-09-01"],
          ["Failed", 1, "2026-09-01"],
          ["Password", 0, "2026-09-02"],
          ["Failed", 0, "2026-09-02"],
        ])}
        step="day"
      />,
    );
    const card = screen.getByRole("region", { name: "Sign-ins" });
    expect(
      within(card).getByText(
        "Successful sign-ins by method, and failed attempts.",
      ),
    ).toBeInTheDocument();
    expect(card.querySelector("svg")).not.toBeNull();

    rerender(
      <TimeSeriesChart
        metric={{ ...series([]), id: "visits_over_time", chartType: "line" }}
        step="week"
      />,
    );
    expect(
      screen.getByText("No activity recorded for the selected period."),
    ).toBeInTheDocument();
  });

  it("draws a line chart for visits", () => {
    render(
      <TimeSeriesChart
        metric={{
          id: "visits_over_time",
          title: "Visits and visitors",
          chartType: "line",
          defaultFilter: "series",
          data: [
            { series: "Visits", count: 3, date: "2026-09" },
            { series: "Visitors", count: 2, date: "2026-09" },
          ],
        }}
        step="month"
      />,
    );
    expect(
      screen.getByText("Visitors are distinct accounts."),
    ).toBeInTheDocument();
  });

  it("ranks the pages under their names, with the parts of VariaMos they belong to", () => {
    render(
      <RankingChart
        metric={{
          id: "top_visited_pages",
          title: "Most visited pages",
          chartType: "ranking",
          defaultFilter: "page",
          labelKey: "page",
          data: [
            { page: "UserLanguageList", count: 963 },
            { page: "UserList", count: 177 },
            { page: "SharedExperimentsList", count: 2 },
          ],
        }}
      />,
    );
    const legend = screen.getByRole("list");
    expect(
      within(legend)
        .getAllByRole("listitem")
        .map((i) => i.textContent),
    ).toEqual(["Languages", "Administration", "Laboratory"]);
    expect(screen.getByText("My languages")).toBeInTheDocument();
  });

  it("ranks other values as they come, without a legend", () => {
    render(
      <RankingChart
        metric={{
          id: "models_by_type",
          title: "Models by type",
          chartType: "ranking",
          defaultFilter: "type",
          labelKey: "type",
          data: [{ type: "Scope", count: 26 }],
        }}
      />,
    );
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText("Scope")).toBeInTheDocument();
  });

  it("shows a figure without a change when there is none to compare", () => {
    render(
      <KeyFigures
        withChange
        figures={[
          {
            key: "returning_users",
            label: "Returning users",
            unit: "percent",
            count: 50,
            previous: null,
          },
          {
            key: "visits",
            label: "Visits",
            unit: "count",
            count: 5,
            previous: 5,
          },
        ]}
      />,
    );
    expect(screen.getByTestId("figure-returning_users")).toHaveTextContent(
      "50 %no earlier figure",
    );
    expect(screen.getByText("no change vs previous period")).toHaveClass(
      "text-muted",
    );
  });
});

describe("PeriodPicker", () => {
  const period = { fromDate: "2026-09-01", toDate: "2026-09-30" };

  it("gives a ready-made period with its key", async () => {
    const onChange = vi.fn();
    render(
      <PeriodPicker
        period={period}
        preset="30d"
        isLoading={false}
        onChange={onChange}
      />,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "7 days" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fromDate: expect.any(String) }),
      "7d",
    );
    expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("gives a month chosen by hand, without a key", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PeriodPicker
        period={period}
        preset="30d"
        isLoading={false}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Custom…" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Period" }),
      "month",
    );
    await user.type(screen.getByLabelText("Month"), "2026-02");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onChange).toHaveBeenCalledWith(
      { fromDate: "2026-02-01", toDate: "2026-02-28" },
      null,
    );
  });

  it("draws the sign-ins grid as a table, with the busiest hour, and says when there is nothing", () => {
    const grid = (data: Metric["data"]): Metric => ({
      id: "sign_ins_by_hour",
      title: "Sign-ins by day and hour (America/Bogota)",
      chartType: "heatmap",
      defaultFilter: "day",
      labelKey: "hour",
      data,
    });
    const { rerender } = render(
      <HourGridChart
        metric={grid([
          { day: 3, hour: 10, count: 4 },
          { day: 6, hour: 5, count: 1 },
          { day: 1, hour: 0, count: 0 },
        ])}
      />,
    );
    const card = screen.getByRole("region", {
      name: "Sign-ins by day and hour (America/Bogota)",
    });
    const table = within(card).getByRole("table");
    // A row header per day, Monday first
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(
      within(card).getByText(/Busiest: Wednesday, 10:00–11:00/),
    ).toHaveTextContent("(4 sign-ins)");
    expect(screen.getByTestId("sign_ins_by_hour-3-10")).toHaveAttribute(
      "title",
      "Wednesday, 10:00–11:00: 4 sign-ins",
    );
    expect(screen.getByTestId("sign_ins_by_hour-6-5")).toHaveAttribute(
      "title",
      "Saturday, 05:00–06:00: 1 sign-in",
    );
    expect(screen.getByTestId("sign_ins_by_hour-3-10")).toHaveTextContent("4");
    expect(screen.getByTestId("sign_ins_by_hour-7-23")).toHaveAttribute(
      "title",
      "Sunday, 23:00–00:00: 0 sign-ins",
    );
    // The busiest cell is the darkest, an empty one the neutral of the page
    expect(
      screen.getByTestId("sign_ins_by_hour-3-10").style.background,
    ).not.toBe(screen.getByTestId("sign_ins_by_hour-6-5").style.background);
    expect(
      screen.getByTestId("sign_ins_by_hour-1-0").style.background,
    ).toContain("--bs-tertiary-bg");

    rerender(<HourGridChart metric={grid(null)} />);
    expect(
      screen.getByText("No activity recorded for the selected period."),
    ).toBeInTheDocument();
  });

  it("names what a grid counts: visits, sign-ins, or events for another one", () => {
    const grid = (id: string): Metric => ({
      id,
      title: `${id} (UTC)`,
      chartType: "heatmap",
      defaultFilter: "day",
      labelKey: "hour",
      data: [{ day: 2, hour: 14, count: 1 }],
    });
    const { rerender } = render(
      <HourGridChart metric={grid("visits_by_hour")} />,
    );
    expect(screen.getByTestId("visits_by_hour-2-14")).toHaveAttribute(
      "title",
      "Tuesday, 14:00–15:00: 1 visit",
    );
    expect(
      screen.getByText(/Pages opened, in the hour of the visit/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "visits_by_hour (UTC): visits for each day of the week and hour.",
      ),
    ).toBeInTheDocument();

    rerender(<HourGridChart metric={grid("downloads_by_hour")} />);
    expect(screen.getByTestId("downloads_by_hour-2-14")).toHaveAttribute(
      "title",
      "Tuesday, 14:00–15:00: 1 event",
    );
  });

  it("steps a count by quarter of the busiest hour", () => {
    expect([0, 1, 2, 3, 4, 5, 8].map((count) => stepOf(count, 8))).toEqual([
      0, 1, 1, 2, 2, 3, 4,
    ]);
    expect(stepOf(3, 0)).toBe(0);
  });
});
