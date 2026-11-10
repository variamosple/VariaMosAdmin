import type { FC } from "react";
import {
  type DateValue,
  formatDate,
  formatDateTime,
  formatZonedDateTime,
  toDate,
} from "@/shared/constants";

interface DateTimeProps {
  value: DateValue;
  /** Shows the day only. */
  dateOnly?: boolean;
}

/**
 * A date shown the same way on every screen (UX-31). The `<time>` element
 * carries the exact moment for the browser and assistive technologies; its
 * tooltip names the time zone the date is shown in.
 */
export const DateTime: FC<DateTimeProps> = ({ value, dateOnly = false }) => {
  const date = toDate(value);
  if (!date) return <>N/A</>;
  return (
    <time dateTime={date.toISOString()} title={formatZonedDateTime(date)}>
      {dateOnly ? formatDate(date) : formatDateTime(date)}
    </time>
  );
};
