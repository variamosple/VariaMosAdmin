import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "@/shared/constants";
import { DateTime } from ".";

const MOMENT = "2026-10-09T14:05:00.000Z";

describe("DateTime", () => {
  it("shows the date and time, with the exact moment and the time zone", () => {
    render(<DateTime value={MOMENT} />);

    const time = screen.getByText(formatDateTime(MOMENT));
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", MOMENT);
    // The tooltip adds the zone the date is shown in
    expect(time.getAttribute("title")).toMatch(
      new RegExp(`^${formatDateTime(MOMENT)} \\S+`),
    );
  });

  it("shows the day only when asked", () => {
    render(<DateTime value={MOMENT} dateOnly />);

    expect(screen.getByText(formatDate(MOMENT)).tagName).toBe("TIME");
  });

  it.each([undefined, null, "", "not a date"])("shows N/A for %j", (value) => {
    const { container } = render(<DateTime value={value} />);

    expect(container).toHaveTextContent("N/A");
    expect(container.querySelector("time")).toBeNull();
  });
});

describe("date formats", () => {
  it("write every date the same way, year first", () => {
    expect(formatDate(MOMENT)).toMatch(/^2026-10-\d{2}$/);
    expect(formatDateTime(MOMENT)).toMatch(/^2026-10-\d{2}, \d{2}:\d{2}$/);
  });
});
