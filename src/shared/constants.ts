export type DateValue = Date | string | number | null | undefined;

/** The date, or undefined when the value is missing or not a date. */
export const toDate = (date: DateValue): Date | undefined => {
  if (!date) return undefined;
  const parsedDate = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

// One locale for every date of the interface (UX-31): "2026-10-09, 14:05",
// in the time zone of the browser.
const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};
const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export const formatDateTime = (date: DateValue): string => {
  const parsedDate = toDate(date);
  if (!parsedDate) return "N/A";
  return new Intl.DateTimeFormat("en-CA", {
    ...DATE_FORMAT,
    ...TIME_FORMAT,
  }).format(parsedDate);
};

export const formatDate = (date: DateValue): string => {
  const parsedDate = toDate(date);
  if (!parsedDate) return "N/A";
  return new Intl.DateTimeFormat("en-CA", DATE_FORMAT).format(parsedDate);
};

/** The date and time with the name of their time zone: "2026-10-09, 14:05 CET". */
export const formatZonedDateTime = (date: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    ...DATE_FORMAT,
    ...TIME_FORMAT,
    timeZoneName: "short",
  }).format(date);

export const formatBoolean = (
  value?: boolean,
  yesValue: string = "Yes",
  noValue: string = "No",
  nullValue?: string,
) => {
  if (value === undefined || value === null) return nullValue || "";

  return value ? yesValue : noValue;
};
