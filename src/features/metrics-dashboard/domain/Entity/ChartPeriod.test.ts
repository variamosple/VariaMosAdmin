import { monthPeriod, yearPeriod } from "./ChartPeriod";

describe("ChartPeriod", () => {
  it.each([
    ["2026-01", "2026-01-01", "2026-01-31"],
    ["2026-09", "2026-09-01", "2026-09-30"],
    ["2026-12", "2026-12-01", "2026-12-31"],
    ["2028-02", "2028-02-01", "2028-02-29"],
    ["2026-02", "2026-02-01", "2026-02-28"],
  ])("gives the first and last day of %s", (month, fromDate, toDate) => {
    expect(monthPeriod(month)).toEqual({ fromDate, toDate });
  });

  it.each(["", "2026", "2026-13", "2026-00", "26-09", "x2026-09", "2026-09x"])(
    "gives no period for the month %j",
    (month) => {
      expect(monthPeriod(month)).toBeNull();
    },
  );

  it("gives the whole year, and nothing for a value that is not a year", () => {
    expect(yearPeriod("2026")).toEqual({
      fromDate: "2026-01-01",
      toDate: "2026-12-31",
    });
    expect(yearPeriod("")).toBeNull();
    expect(yearPeriod("20266")).toBeNull();
  });
});
