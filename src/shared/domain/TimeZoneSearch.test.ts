// cspell:ignore Kolkata Calcutta Alemania
import {
  choiceOf,
  countryName,
  describeChoice,
  searchTimeZones,
  timeZoneChoices,
} from "./TimeZoneSearch";

const NOW = new Date("2026-11-15T13:00:00Z");
const zonesOf = (query: string, country?: string) =>
  searchTimeZones(query, country).map((choice) => choice.zone);

describe("TimeZoneSearch (EV-115)", () => {
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

  it("finds nothing for words no zone has", () => {
    expect(zonesOf("atlantis")).toEqual([]);
  });

  it("says the country, the city, the offset and the current time", () => {
    const bogota = searchTimeZones("Colombia")[0];
    expect(describeChoice(bogota, NOW)).toBe(
      "Colombia · Bogota · UTC−5 · 08:00",
    );
    const denver = searchTimeZones("denver")[0];
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
