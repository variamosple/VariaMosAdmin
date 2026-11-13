// cspell:ignore Kolkata Calcutta Alemania ghan Addis Ababa Santarem
import { itemAt } from "@/shared/tests/itemAt";

type Search = typeof import("./TimeZoneSearch");
let choiceOf: Search["choiceOf"];
let countryName: Search["countryName"];
let describeChoice: Search["describeChoice"];
let searchTimeZones: Search["searchTimeZones"];
let timeZoneChoices: Search["timeZoneChoices"];

const NOW = new Date("2026-11-15T13:00:00Z");
const zonesOf = (query: string, country?: string) =>
  searchTimeZones(query, country).map((choice) => choice.zone);

describe("TimeZoneSearch (EV-115)", () => {
  // The module keeps the zones and their words once worked out: each test
  // starts from a new copy, so that none reads what an earlier one left
  beforeEach(async () => {
    vi.resetModules();
    ({
      choiceOf,
      countryName,
      describeChoice,
      searchTimeZones,
      timeZoneChoices,
    } = await import("./TimeZoneSearch"));
  });

  it("finds the zone of a country, by its name in English or in Spanish", () => {
    expect(zonesOf("Colombia")).toEqual(["America/Bogota"]);
    expect(zonesOf("alemania")).toContain("Europe/Berlin");
    expect(zonesOf("Germany")).toContain("Europe/Berlin");
  });

  it("finds a city with or without its accents", () => {
    expect(zonesOf("Bogotá")).toEqual(["America/Bogota"]);
    expect(zonesOf("sao paulo")).toEqual(["America/Sao_Paulo"]);
  });

  it("gives every zone of a country with several, with the part each covers", () => {
    const united = searchTimeZones("united states");
    expect(united.length).toBeGreaterThan(20);
    expect(united.find((c) => c.city === "Denver")?.region).toBe(
      "Mountain (most areas)",
    );
    expect(zonesOf("united states mountain")).toContain("America/Denver");
  });

  it("puts the zones of the country of the profile first", () => {
    expect(zonesOf("america", "CO")[0]).toBe("America/Bogota");
    expect(zonesOf("", "CO")).toEqual(["America/Bogota"]);
    expect(zonesOf("")).toEqual([]);
  });

  it("puts the zones whose city or country starts with the words first", () => {
    expect(zonesOf("paris")[0]).toBe("Europe/Paris");
  });

  it("ranks the city that starts with the words after the profile's country, then the others", () => {
    expect(zonesOf("san", "AR").slice(0, 4)).toEqual([
      // In Argentina, the cities that start with the words first
      "America/Argentina/San_Juan",
      "America/Argentina/San_Luis",
      // Then the rest of Argentina: "san" is only in "Santa Cruz"
      "America/Argentina/Rio_Gallegos",
      // Then the cities of other countries that start with the words
      "America/Santarem",
    ]);
  });

  it("ranks a country that starts with the words before one that only holds them", () => {
    // Ghana starts with "ghan", Afghanistan holds it
    expect(zonesOf("ghan")).toEqual(["Africa/Accra", "Asia/Kabul"]);
    // Ethiopia starts with "eth" in English only, the Netherlands hold it
    expect(itemAt(zonesOf("eth"), 0)).toBe("Africa/Addis_Ababa");
  });

  it("finds nothing for words no zone has", () => {
    expect(zonesOf("atlantis")).toEqual([]);
    // Spaces alone are no word
    expect(zonesOf("   ")).toEqual([]);
  });

  it("matches whatever the case of the words", () => {
    expect(zonesOf("SAO PAULO")).toEqual(["America/Sao_Paulo"]);
  });

  it("works out the names of a country once", () => {
    const of = vi.spyOn(Intl.DisplayNames.prototype, "of");
    expect(countryName("FJ")).toBe("Fiji");
    const calls = of.mock.calls.length;
    expect(countryName("FJ")).toBe("Fiji");
    expect(of).toHaveBeenCalledTimes(calls);
    of.mockRestore();
  });

  it("says the country, the city, the offset and the current time", () => {
    const bogota = itemAt(searchTimeZones("Colombia"), 0);
    expect(describeChoice(bogota, NOW)).toBe(
      "Colombia · Bogota · UTC−5 · 08:00",
    );
    const denver = itemAt(searchTimeZones("denver"), 0);
    expect(describeChoice(denver, NOW)).toBe(
      "United States · Denver · Mountain (most areas) · UTC−7 · 06:00",
    );
    expect(describeChoice(choiceOf("UTC") as never, NOW)).toBe(
      "UTC · UTC · 13:00",
    );
  });

  it("names a zone under its current name, whatever this browser calls it", () => {
    expect(choiceOf("Asia/Kolkata")?.city).toBe("Kolkata");
    expect(choiceOf("Asia/Calcutta")?.countryCode).toBe("IN");
    expect(choiceOf("Mars/Base")).toBeNull();
    expect(countryName("CO")).toBe("Colombia");
  });

  it("gives a country to almost every zone of the browser", () => {
    const all = timeZoneChoices();
    expect(all.filter((c) => !c.countryCode).length).toBeLessThan(10);
    expect(new Set(all.map((c) => c.zone)).size).toBe(all.length);
  });
});
