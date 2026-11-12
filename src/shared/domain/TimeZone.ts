/**
 * Times shown in a time zone (EV-115 lot C). Every instant stays in UTC;
 * a time zone only changes how it is shown and typed. The browser's Intl
 * data gives the offsets, summer time included, without a library.
 */

const MINUTE_MS = 60_000;
const HALF_DAY_MS = 12 * 60 * MINUTE_MS;

/** The time zone of the browser, or UTC if it gives none. */
export const browserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/** Every time zone the browser knows, UTC first. */
export const knownTimeZones = (): string[] => [
  "UTC",
  ...Intl.supportedValuesOf("timeZone").filter((zone) => zone !== "UTC"),
];

export const isKnownTimeZone = (zone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

/** "America/Argentina/Buenos_Aires" gives "Buenos Aires". */
export const cityOf = (zone: string): string =>
  (zone.split("/").pop() ?? zone).replaceAll("_", " ");

interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const wallTimeOf = (instant: Date, zone: string): WallTime => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
  };
};

const asUtcMs = (wall: WallTime) =>
  Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);

/** Minutes ahead of UTC at that instant: -300 in Bogota, 60 or 120 in Paris. */
export const offsetMinutes = (instant: Date, zone: string): number => {
  const flooredToMinute = Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
  return Math.round(
    (asUtcMs(wallTimeOf(instant, zone)) - flooredToMinute) / MINUTE_MS,
  );
};

/** "UTC−5", "UTC+5:30", or "UTC". */
export const formatOffset = (minutes: number): string => {
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  const minutesPart = rest ? `:${String(rest).padStart(2, "0")}` : "";
  return `UTC${sign}${hours}${minutesPart}`;
};

const two = (n: number) => String(n).padStart(2, "0");
const dateOf = (wall: WallTime) =>
  `${wall.year}-${two(wall.month)}-${two(wall.day)}`;
const timeOf = (wall: WallTime) => `${two(wall.hour)}:${two(wall.minute)}`;

/** "2026-11-15 13:00 UTC". */
export const formatUtc = (instant: Date): string => {
  const wall = wallTimeOf(instant, "UTC");
  return `${dateOf(wall)} ${timeOf(wall)} UTC`;
};

/**
 * The instant in UTC, then in the time zone: "2026-11-15 13:00 UTC ·
 * 08:00 Bogota (UTC−5)". The local date is written when it is another day.
 */
export const describeInstant = (instant: Date, zone: string): string => {
  const utc = formatUtc(instant);
  if (zone === "UTC" || zone === "Etc/UTC") return utc;
  const local = wallTimeOf(instant, zone);
  const sameDay = dateOf(local) === dateOf(wallTimeOf(instant, "UTC"));
  const when = sameDay ? timeOf(local) : `${dateOf(local)} ${timeOf(local)}`;
  return `${utc} · ${when} ${cityOf(zone)} (${formatOffset(offsetMinutes(instant, zone))})`;
};

/** The value of a datetime-local field for the instant in the zone. */
export const inputOf = (instant: Date, zone: string): string => {
  const wall = wallTimeOf(instant, zone);
  return `${dateOf(wall)}T${timeOf(wall)}`;
};

const INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * What a time typed in a zone means. When clocks move forward, an hour
 * does not exist ("gap"); when they move back, an hour comes twice
 * ("ambiguous", both instants, the earlier first).
 */
export type TypedTime =
  | { kind: "invalid" }
  | { kind: "single"; instant: Date }
  | { kind: "gap" }
  | { kind: "ambiguous"; instants: [Date, Date] };

export const instantsOfInput = (input: string, zone: string): TypedTime => {
  const match = INPUT.exec(input);
  if (!match) return { kind: "invalid" };
  // The pattern has the five groups, so none of them is undefined
  const wall = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const wallMs = asUtcMs(wall);
  // Date.UTC rolls 31 February over: such a day does not exist
  if (inputOf(new Date(wallMs), "UTC") !== input) return { kind: "invalid" };
  // The offsets on both sides of the typed time; a change of offset
  // between them is a change of clocks
  const offsets = new Set([
    offsetMinutes(new Date(wallMs - HALF_DAY_MS), zone),
    offsetMinutes(new Date(wallMs + HALF_DAY_MS), zone),
  ]);
  const instants = [...offsets]
    .map((offset) => new Date(wallMs - offset * MINUTE_MS))
    .filter((instant) => inputOf(instant, zone) === input)
    .sort((a, b) => a.getTime() - b.getTime());
  // Two offsets at most, so two instants at most
  const [first, second] = instants;
  if (!first) return { kind: "gap" };
  if (!second) return { kind: "single", instant: first };
  return { kind: "ambiguous", instants: [first, second] };
};
