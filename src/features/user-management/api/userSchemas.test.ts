import { userSchema } from "./userSchemas";

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
