// cspell:ignore Kolkata
import {
  cityOf,
  formatOffset,
  inputOf,
  knownTimeZones,
  offsetMinutes,
} from "./TimeZone";
import { ZONE_COUNTRIES } from "./timeZoneCountries";

/**
 * Finding a time zone by its country, its city or its name (EV-115). The
 * browser gives the zones; the IANA table gives their country, which the
 * browser does not give everywhere.
 */
export interface TimeZoneChoice {
  /** The name this browser gives the zone. */
  zone: string;
  /** Its city, under the current IANA name (Kolkata, not Calcutta). */
  city: string;
  countryCode: string | null;
  /** The part of the country it covers, when the country has several zones. */
  region: string | null;
}

/** Country names in English and Spanish, the languages of the site's users. */
const NAME_LOCALES = ["en", "es"];

let displayNames: Intl.DisplayNames[] | null = null;
const namesByCountry = new Map<string, string[]>();

const countryNames = (code: string): string[] => {
  const known = namesByCountry.get(code);
  if (known) return known;
  displayNames ??= NAME_LOCALES.map(
    (locale) => new Intl.DisplayNames([locale], { type: "region" }),
  );
  const names = displayNames
    .map((names) => {
      try {
        return names.of(code);
      } catch {
        return undefined;
      }
    })
    .filter((name): name is string => Boolean(name));
  namesByCountry.set(code, names);
  return names;
};

/** The name of the country in English, or its code. */
export const countryName = (code: string): string =>
  countryNames(code)[0] ?? code;

// Some browsers keep older names (Asia/Calcutta for Asia/Kolkata): both
// sides are compared under the name this browser gives
const browserName = (zone: string): string | null => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
};

let choices: TimeZoneChoice[] | null = null;

/** Every zone of the browser, with its country when it has one. */
export const timeZoneChoices = (): TimeZoneChoice[] => {
  if (choices) return choices;
  const rows = ZONE_COUNTRIES.trim()
    .split("\n")
    .map((line) => line.split("|"));
  const zonesPerCountry = new Map<string, number>();
  for (const [code] of rows) {
    zonesPerCountry.set(code, (zonesPerCountry.get(code) ?? 0) + 1);
  }
  const byZone = new Map<string, Omit<TimeZoneChoice, "zone">>();
  for (const [code, name, region] of rows) {
    const zone = browserName(name);
    if (!zone || byZone.has(zone)) continue;
    byZone.set(zone, {
      city: cityOf(name),
      countryCode: code,
      region: (zonesPerCountry.get(code) ?? 0) > 1 && region ? region : null,
    });
  }
  choices = knownTimeZones().map((zone) => ({
    zone,
    city: cityOf(zone),
    countryCode: null,
    region: null,
    ...byZone.get(zone),
  }));
  return choices;
};

/** Lower case, without accents: "Bogotá" and "bogota" meet. */
const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const wordsByZone = new Map<string, string>();

const wordsOf = (choice: TimeZoneChoice) => {
  let words = wordsByZone.get(choice.zone);
  if (words === undefined) {
    words = plain(
      [
        choice.zone.replaceAll(/[/_]/g, " "),
        choice.city,
        choice.region ?? "",
        ...(choice.countryCode ? countryNames(choice.countryCode) : []),
      ].join(" "),
    );
    wordsByZone.set(choice.zone, words);
  }
  return words;
};

const startsWithQuery = (choice: TimeZoneChoice, query: string) =>
  plain(choice.city).startsWith(query) ||
  (choice.countryCode !== null &&
    countryNames(choice.countryCode).some((name) =>
      plain(name).startsWith(query),
    ));

/**
 * The zones that match every word typed: those of the country of the
 * profile first, then those whose city or country starts with the words.
 * Without a word, the zones of that country.
 */
export const searchTimeZones = (
  query: string,
  preferredCountry?: string | null,
): TimeZoneChoice[] => {
  const all = timeZoneChoices();
  const typed = plain(query.trim());
  if (!typed) {
    return all.filter(
      (choice) => preferredCountry && choice.countryCode === preferredCountry,
    );
  }
  const words = typed.split(/\s+/);
  const rank = (choice: TimeZoneChoice) =>
    (choice.countryCode === preferredCountry ? 0 : 2) +
    (startsWithQuery(choice, typed) ? 0 : 1);
  return all
    .filter((choice) => {
      const haystack = wordsOf(choice);
      return words.every((word) => haystack.includes(word));
    })
    .map((choice) => ({ choice, rank: rank(choice) }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        countryName(a.choice.countryCode ?? "").localeCompare(
          countryName(b.choice.countryCode ?? ""),
        ) ||
        a.choice.city.localeCompare(b.choice.city),
    )
    .map(({ choice }) => choice);
};

/** "Colombia · Bogota · UTC−5 · 08:00", the time being the current one. */
export const describeChoice = (choice: TimeZoneChoice, now: Date): string =>
  [
    choice.countryCode ? countryName(choice.countryCode) : null,
    choice.city,
    choice.region,
    formatOffset(offsetMinutes(now, choice.zone)),
    inputOf(now, choice.zone).slice(11),
  ]
    .filter(Boolean)
    .join(" · ");

/** The choice of a zone saved in the profile, or null if this browser has none. */
export const choiceOf = (zone: string): TimeZoneChoice | null => {
  const name = browserName(zone);
  return timeZoneChoices().find((choice) => choice.zone === name) ?? null;
};
