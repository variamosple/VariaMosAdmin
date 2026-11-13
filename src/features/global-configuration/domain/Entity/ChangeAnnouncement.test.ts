import { announcementOfChanges } from "./ChangeAnnouncement";

const NOTE =
  "The rules apply when you next choose a password; your current password keeps working.";

describe("announcementOfChanges (EV-115 lot A)", () => {
  it("offers nothing when no saved setting is one users notice", () => {
    expect(announcementOfChanges([{ key: "site.name" }])).toBeNull();
    expect(announcementOfChanges([])).toBeNull();
  });

  it("joins the sentences of the settings saved together, each note once", () => {
    expect(
      announcementOfChanges([
        {
          key: "security.password.min_length",
          announcement: {
            title: "Password rules updated",
            body: "Passwords must now have at least 14 characters.",
            note: NOTE,
          },
        },
        { key: "site.name" },
        {
          key: "security.password.require_special",
          announcement: {
            title: "Password rules updated",
            body: "Passwords must now contain a special character.",
            note: NOTE,
          },
        },
      ]),
    ).toEqual({
      keys: [
        "security.password.min_length",
        "security.password.require_special",
      ],
      title: "Password rules updated",
      body: `Passwords must now have at least 14 characters. Passwords must now contain a special character. ${NOTE}`,
    });
  });

  it("gives a general title to settings of different kinds, and no note when none has one", () => {
    const announcement = announcementOfChanges([
      {
        key: "security.lockout.max_attempts",
        announcement: {
          title: "Sign-in protection updated",
          body: "An account is now locked after 5 failed sign-in attempts.",
        },
      },
      {
        key: "security.mfa.trusted_device_days",
        announcement: {
          title: "Two-factor sign-in updated",
          body: "The two-factor sign-in code is now asked at every sign-in, on every browser.",
        },
      },
    ]);
    expect(announcement?.title).toBe("Settings updated");
    expect(announcement?.body).toBe(
      "An account is now locked after 5 failed sign-in attempts. The two-factor sign-in code is now asked at every sign-in, on every browser.",
    );
  });
});
