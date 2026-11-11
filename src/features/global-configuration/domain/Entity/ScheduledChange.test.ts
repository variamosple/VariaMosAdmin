import {
  announcementOfScheduledChange,
  describeValue,
  formatLocal,
  formatUtc,
  instantOfUtcInput,
  type ScheduledChange,
  utcInputOf,
} from "./ScheduledChange";

describe("ScheduledChange (EV-115 lot B)", () => {
  it("reads a date and time typed in UTC", () => {
    expect(instantOfUtcInput("2026-11-15T13:00")).toBe(
      "2026-11-15T13:00:00.000Z",
    );
    expect(instantOfUtcInput("2026-11-15")).toBeNull();
    expect(instantOfUtcInput("2026-13-45T25:00")).toBeNull();
    expect(instantOfUtcInput("")).toBeNull();
  });

  it("gives the field value of an instant in UTC, whatever its offset", () => {
    expect(utcInputOf("2026-11-15T08:00:00-05:00")).toBe("2026-11-15T13:00");
  });

  it("says an instant in UTC and in a time zone", () => {
    expect(formatUtc("2026-11-15T13:00:00.000Z")).toBe("2026-11-15 13:00 UTC");
    expect(formatLocal("2026-11-15T13:00:00.000Z", "America/Bogota")).toMatch(
      /8:00/,
    );
    expect(formatLocal("2026-11-15T13:00:00.000Z", "Not/AZone")).toBe(
      "2026-11-15 13:00 UTC",
    );
  });

  it("says a value", () => {
    expect(describeValue(14)).toBe("14");
    expect(describeValue(true)).toBe("on");
    expect(describeValue(false)).toBe("off");
  });

  it("makes the dialog announcement of a change, its note last", () => {
    const change = {
      key: "security.password.min_length",
      announcement: {
        title: "Password rules updated",
        body: "From 15 November 2026 at 13:00 UTC, passwords must have at least 14 characters.",
        note: "Your current password keeps working.",
      },
    } as ScheduledChange;

    expect(announcementOfScheduledChange(change)).toEqual({
      keys: ["security.password.min_length"],
      title: "Password rules updated",
      body: "From 15 November 2026 at 13:00 UTC, passwords must have at least 14 characters. Your current password keeps working.",
    });
    expect(
      announcementOfScheduledChange({ ...change, announcement: undefined }),
    ).toBeNull();
  });
});
