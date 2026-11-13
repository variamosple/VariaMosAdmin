// cspell:ignore Kolkata
import {
  browserTimeZone,
  cityOf,
  describeInstant,
  formatOffset,
  formatUtc,
  inputOf,
  instantsOfInput,
  isKnownTimeZone,
  knownTimeZones,
  offsetMinutes,
} from "./TimeZone";

const at = (iso: string) => new Date(iso);

describe("TimeZone (EV-115 lot C)", () => {
  it("shows an instant in UTC, then in the time zone (validation criterion)", () => {
    expect(describeInstant(at("2026-11-15T13:00:00Z"), "America/Bogota")).toBe(
      "2026-11-15 13:00 UTC · 08:00 Bogota (UTC−5)",
    );
  });

  it("follows summer time: 13:00 UTC is 15:00 in Paris in July, 14:00 in January", () => {
    expect(describeInstant(at("2026-07-15T13:00:00Z"), "Europe/Paris")).toBe(
      "2026-07-15 13:00 UTC · 15:00 Paris (UTC+2)",
    );
    expect(describeInstant(at("2027-01-15T13:00:00Z"), "Europe/Paris")).toBe(
      "2027-01-15 13:00 UTC · 14:00 Paris (UTC+1)",
    );
  });

  it("writes the local date when it is another day, and nothing more for UTC", () => {
    expect(describeInstant(at("2026-11-15T02:00:00Z"), "America/Bogota")).toBe(
      "2026-11-15 02:00 UTC · 2026-11-14 21:00 Bogota (UTC−5)",
    );
    expect(describeInstant(at("2026-11-15T02:00:00Z"), "UTC")).toBe(
      "2026-11-15 02:00 UTC",
    );
    expect(describeInstant(at("2026-11-15T02:00:00Z"), "Etc/UTC")).toBe(
      "2026-11-15 02:00 UTC",
    );
  });

  it("writes offsets in hours, and minutes when there are", () => {
    expect(formatOffset(0)).toBe("UTC");
    expect(formatOffset(-300)).toBe("UTC−5");
    expect(formatOffset(330)).toBe("UTC+5:30");
    // Old local mean times have offsets of a few minutes
    expect(formatOffset(305)).toBe("UTC+5:05");
    expect(offsetMinutes(at("2026-11-15T13:00:00Z"), "Asia/Kolkata")).toBe(330);
    expect(offsetMinutes(at("2026-11-15T13:00:30Z"), "America/Bogota")).toBe(
      -300,
    );
  });

  it("names the city of a time zone", () => {
    expect(cityOf("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(cityOf("UTC")).toBe("UTC");
  });

  it("reads a typed time in the time zone", () => {
    expect(instantsOfInput("2026-11-15T08:00", "America/Bogota")).toEqual({
      kind: "single",
      instant: at("2026-11-15T13:00:00Z"),
    });
    expect(inputOf(at("2026-11-15T13:00:00Z"), "America/Bogota")).toBe(
      "2026-11-15T08:00",
    );
    expect(formatUtc(at("2026-11-15T13:00:00Z"))).toBe("2026-11-15 13:00 UTC");
  });

  it("says that 02:30 does not exist in Paris when clocks move forward (validation criterion)", () => {
    expect(instantsOfInput("2026-03-29T02:30", "Europe/Paris")).toEqual({
      kind: "gap",
    });
  });

  it("gives both instants of 02:30 in Paris when clocks move back, the earlier first", () => {
    expect(instantsOfInput("2026-10-25T02:30", "Europe/Paris")).toEqual({
      kind: "ambiguous",
      instants: [at("2026-10-25T00:30:00Z"), at("2026-10-25T01:30:00Z")],
    });
  });

  it.each(["", "2026-11-15", "2026-02-30T10:00", "2026-11-15T25:00"])(
    "refuses the input %j",
    (input) => {
      expect(instantsOfInput(input, "Europe/Paris")).toEqual({
        kind: "invalid",
      });
    },
  );

  it("lists the time zones of the browser, UTC first", () => {
    const zones = knownTimeZones();
    expect(zones[0]).toBe("UTC");
    expect(zones).toContain("America/Bogota");
    expect(zones.filter((zone) => zone === "UTC")).toHaveLength(1);
    expect(isKnownTimeZone("Europe/Paris")).toBe(true);
    expect(isKnownTimeZone("Mars/Base")).toBe(false);
    expect(isKnownTimeZone(browserTimeZone())).toBe(true);
  });

  it("puts UTC first once, even when the browser lists it among the others", () => {
    vi.spyOn(Intl, "supportedValuesOf").mockReturnValue([
      "Europe/Paris",
      "UTC",
    ]);
    expect(knownTimeZones()).toEqual(["UTC", "Europe/Paris"]);
    vi.restoreAllMocks();
  });

  it.each([
    ["the browser's", "America/Bogota", "America/Bogota"],
    ["UTC when the browser gives none", "", "UTC"],
  ])("takes %s time zone", (_, given, expected) => {
    const options = Intl.DateTimeFormat().resolvedOptions();
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      ...options,
      timeZone: given,
    });
    expect(browserTimeZone()).toBe(expected);
    vi.restoreAllMocks();
  });
});
