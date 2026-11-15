import { countryOfTimeZone } from "./DefaultCountry";

describe("countryOfTimeZone (EV-90)", () => {
  it.each([
    ["America/Bogota", "CO"],
    ["Europe/Paris", "FR"],
    ["America/Santiago", "CL"],
    ["America/Argentina/Buenos_Aires", "AR"],
  ])("gives the country of %s", (zone, code) => {
    expect(countryOfTimeZone(zone)).toBe(code);
  });

  it.each(["UTC", "Not/AZone"])("gives none for %s", (zone) => {
    expect(countryOfTimeZone(zone)).toBeNull();
  });
});
