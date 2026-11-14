import {
  MAINTENANCE_NOTICE_MINUTES,
  maintenanceAnnouncementOf,
  maintenanceTimeOf,
} from "./maintenanceAnnouncement";

describe("maintenanceTimeOf", () => {
  it.each([
    ["2026-11-14T14:20:00Z", "2026-11-14T14:30:00.000Z"],
    ["2026-11-14T14:21:10Z", "2026-11-14T14:35:00.000Z"],
    ["2026-11-14T23:55:00Z", "2026-11-15T00:05:00.000Z"],
  ])("suggests a round time at least the notice ahead of %s", (now, at) => {
    expect(maintenanceTimeOf(new Date(now)).toISOString()).toBe(at);
  });

  it("never gives less than the notice", () => {
    const now = new Date("2026-11-14T14:24:59Z");

    const ahead = maintenanceTimeOf(now).getTime() - now.getTime();

    expect(ahead).toBeGreaterThanOrEqual(MAINTENANCE_NOTICE_MINUTES * 60000);
  });
});

describe("maintenanceAnnouncementOf", () => {
  it("names the service and gives the time in UTC", () => {
    const announcement = maintenanceAnnouncementOf(
      { serviceName: "variamos_ms_languages", displayName: "Languages" },
      new Date("2026-11-14T14:20:00Z"),
    );

    expect(announcement).toEqual({
      title: "Maintenance: Languages",
      body:
        "Languages will restart at 14:30 UTC (in about 10 minutes) and may be " +
        "unavailable for a few minutes. Please save your work before then.",
    });
  });

  it("falls back on the service name without a display name", () => {
    const announcement = maintenanceAnnouncementOf(
      { serviceName: "vms_projects" },
      new Date("2026-11-14T14:20:00Z"),
    );

    expect(announcement.title).toBe("Maintenance: vms_projects");
  });
});
