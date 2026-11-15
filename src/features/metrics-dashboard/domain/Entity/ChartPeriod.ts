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

const isoDay = (day: Date) =>
  `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;

/** The last `days` days, today included, on the clock of the browser. */
export const lastDays = (days: number, today = new Date()): ChartPeriod => {
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  return { fromDate: isoDay(from), toDate: isoDay(today) };
};

/** The ready-made periods of the page, the second one by default. */
export const PERIOD_PRESETS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "3m", label: "3 months", days: 91 },
  { key: "12m", label: "12 months", days: 365 },
] as const;

export type PeriodStep = "day" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The step of the charts over time, as the database chooses it: a day up to
 * 3 months, a week up to a year, a month beyond (migration 0026).
 */
export const periodStep = ({ fromDate, toDate }: ChartPeriod): PeriodStep => {
  const days = Math.round(
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) /
      DAY_MS,
  );
  if (days <= 92) return "day";
  if (days <= 366) return "week";
  return "month";
};
