import { userSchema, usersSchema } from "./userSchemas";

const account = {
  id: "u-1",
  user: "ana",
  name: "Ana",
  email: "ana@example.com",
  isEnabled: true,
  isDeleted: false,
  createdAt: "2026-07-20T22:00:00.000Z",
};

describe("userSchema (EV-97 lot 6c)", () => {
  it("reads the dates as Date objects", () => {
    const user = userSchema.parse({
      ...account,
      lastLogin: "2026-10-27T08:30:00.000Z",
    });

    expect(user.createdAt).toEqual(new Date("2026-07-20T22:00:00.000Z"));
    expect(user.lastLogin).toEqual(new Date("2026-10-27T08:30:00.000Z"));
  });

  it("accepts an account that never signed in and has no country", () => {
    const parsed = userSchema.safeParse({
      ...account,
      lastLogin: null,
      countryCode: null,
      countryName: null,
    });

    expect(parsed.success).toBe(true);
  });

  // The user, name and email columns accept NULL in the database
  it("reads a NULL text column as empty text", () => {
    const user = userSchema.parse({ ...account, name: null, user: null });

    expect(user.name).toBe("");
    expect(user.user).toBe("");
  });

  it.each([
    ["a missing creation date", { createdAt: undefined }],
    ["a date that is not ISO text", { createdAt: "yesterday" }],
    ["a status that is not a boolean", { isEnabled: "true" }],
  ])("refuses %s", (_name, change) => {
    expect(userSchema.safeParse({ ...account, ...change }).success).toBe(false);
  });
});

describe("usersSchema (EV-29)", () => {
  it("reads a row stored without creation date and with a flagged address", () => {
    const [row] = usersSchema.parse([
      { ...account, email: "old-address", emailValid: false, createdAt: null },
    ]);

    expect(row).toMatchObject({
      email: "old-address",
      emailValid: false,
      createdAt: null,
    });
  });

  it("reads the rows of a server that does not send emailValid yet", () => {
    expect(usersSchema.safeParse([account]).success).toBe(true);
  });

  it("still refuses a status that is not a boolean", () => {
    expect(
      usersSchema.safeParse([{ ...account, isEnabled: "true" }]).success,
    ).toBe(false);
  });
});
