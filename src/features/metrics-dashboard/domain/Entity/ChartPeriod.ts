// A chart filter by range, by month or by year (EV-90 lot A.3). The API
// takes a start and an end date only: a month or a year becomes its first
// and last day.
export type ChartPeriodMode = "range" | "month" | "year";

export interface ChartPeriod {
  fromDate: string;
  toDate: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09" gives the first and last day of September 2026. */
export const monthPeriod = (month: string): ChartPeriod | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]);
  if (monthIndex < 1 || monthIndex > 12) return null;
  // Day 0 of the next month is the last day of this one
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return {
    fromDate: `${match[1]}-${match[2]}-01`,
    toDate: `${match[1]}-${match[2]}-${pad(lastDay)}`,
  };
};

/** "2026" gives 1 January to 31 December 2026. */
export const yearPeriod = (year: string): ChartPeriod | null =>
  /^\d{4}$/.test(year)
    ? { fromDate: `${year}-01-01`, toDate: `${year}-12-31` }
    : null;
