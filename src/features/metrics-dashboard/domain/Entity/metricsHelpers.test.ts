import { lastDays, periodStep } from "./ChartPeriod";
import { figureChange, figureText, stepLabel } from "./formatFigures";
import {
  hourGridOf,
  keyFiguresOf,
  type Metric,
  rankingOf,
  timeSeriesOf,
} from "./Metric";
import { pageOf } from "./pageNames";

const metricOf = (data: Metric["data"], labelKey?: string): Metric => ({
  id: "m",
  title: "M",
  chartType: "line",
  defaultFilter: "series",
  labelKey,
  data,
});

describe("periods of the page", () => {
  it("counts the last days back from today, today included", () => {
    expect(lastDays(30, new Date(2026, 8, 30))).toEqual({
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
    });
    expect(lastDays(7, new Date(2026, 2, 3))).toEqual({
      fromDate: "2026-02-25",
      toDate: "2026-03-03",
    });
  });

  it("steps by day up to 3 months, by week up to a year, by month beyond, as the database does", () => {
    expect(periodStep({ fromDate: "2026-08-01", toDate: "2026-10-31" })).toBe(
      "day",
    );
    expect(periodStep({ fromDate: "2026-01-01", toDate: "2026-12-31" })).toBe(
      "week",
    );
    expect(periodStep({ fromDate: "2025-01-01", toDate: "2026-12-31" })).toBe(
      "month",
    );
  });
});

describe("figures and labels", () => {
  it("writes a step of each kind", () => {
    expect(stepLabel("2026-09-03", "day")).toBe("3 Sept");
    expect(stepLabel("2026-08-31", "week")).toBe("w/c 31 Aug");
    expect(stepLabel("2026-09", "month")).toBe("Sept 2026");
  });

  it("writes a figure with its unit, and a dash for none", () => {
    expect(figureText(1234, "count")).toBe("1,234");
    expect(figureText(67, "percent")).toBe("67 %");
    expect(figureText(1.25, "decimal")).toBe("1.3");
    expect(figureText(null, "percent")).toBe("–");
  });

  it("compares with the period before, in points for a share", () => {
    const base = { key: "k", label: "K", unit: "count" as const };
    expect(figureChange({ ...base, count: 120, previous: 100 })).toEqual({
      text: "+20 %",
      direction: "up",
    });
    expect(figureChange({ ...base, count: 3, previous: 0 })).toEqual({
      text: "+3 (none before)",
      direction: "up",
    });
    expect(figureChange({ ...base, count: 5, previous: 5 }).direction).toBe(
      "flat",
    );
    expect(
      figureChange({ ...base, unit: "percent", count: 40, previous: 50 }),
    ).toEqual({ text: "-10 pts", direction: "down" });
    expect(figureChange({ ...base, count: 50, previous: null }).direction).toBe(
      "none",
    );
  });
});

describe("chart data", () => {
  it("puts each series of a date on one point, in the order of the series", () => {
    expect(
      timeSeriesOf(
        metricOf([
          { series: "Visits", count: 3, date: "2026-09-01" },
          { series: "Visitors", count: 2, date: "2026-09-01" },
          { series: "Visits", count: 0, date: "2026-09-02" },
          { series: "Visitors", count: 0, date: "2026-09-02" },
        ]),
      ),
    ).toEqual({
      series: ["Visits", "Visitors"],
      points: [
        { date: "2026-09-01", Visits: 3, Visitors: 2 },
        { date: "2026-09-02", Visits: 0, Visitors: 0 },
      ],
    });
  });

  it("reads a ranking by its label column, and only the key figures of a list", () => {
    expect(rankingOf(metricOf([{ page: "home", count: 3 }], "page"))).toEqual([
      { label: "home", count: 3 },
    ]);
    expect(
      keyFiguresOf(
        metricOf([
          { key: "visits", label: "Visits", unit: "count", count: 1 },
          { count: 2 },
        ]),
      ),
    ).toHaveLength(1);
    expect(keyFiguresOf(undefined)).toEqual([]);
  });

  it("names a recorded page and its part of VariaMos, and keeps an unknown one", () => {
    expect(pageOf("UserLanguageList")).toEqual({
      name: "My languages",
      area: "Languages",
    });
    expect(pageOf("SharedExperimentsList").area).toBe("Laboratory");
    expect(pageOf("SomethingNew")).toEqual({
      name: "SomethingNew",
      area: "Other",
    });
  });

  it("reads the sign-ins grid as 7 days of 24 hours, Monday first", () => {
    const grid = hourGridOf(
      metricOf([
        { day: 1, hour: 0, count: 2 },
        { day: 7, hour: 23, count: 5 },
        { day: 8, hour: 1, count: 9 },
        { day: 3, hour: 24, count: 9 },
      ]),
    );
    expect(grid.counts).toHaveLength(7);
    expect(grid.counts.every((row) => row.length === 24)).toBe(true);
    expect(grid.counts[0]?.[0]).toBe(2);
    expect(grid.counts[6]?.[23]).toBe(5);
    // A cell out of the week is left out
    expect(grid).toMatchObject({ max: 5, total: 7 });
    expect(hourGridOf(metricOf(null))).toMatchObject({ max: 0, total: 0 });
  });
});
