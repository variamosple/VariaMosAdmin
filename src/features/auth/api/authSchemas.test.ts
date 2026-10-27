import { passwordPolicySchema, signInSchema } from "./authSchemas";

describe("authentication answers (EV-97 lot 6c)", () => {
  it("accepts a sign-in that opens the session", () => {
    expect(
      signInSchema.safeParse({ id: "u-1", redirect: "https://app" }).success,
    ).toBe(true);
  });

  it("accepts a sign-in that waits for the code", () => {
    expect(
      signInSchema.safeParse({ mfaRequired: true, trustedDeviceDays: 14 })
        .success,
    ).toBe(true);
  });

  it("refuses a sign-in answer with neither", () => {
    expect(signInSchema.safeParse({ id: "u-1" }).success).toBe(false);
  });

  it("refuses a password policy with a length given as text", () => {
    expect(
      passwordPolicySchema.safeParse({
        minLength: "12",
        maxLength: 64,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
      }).success,
    ).toBe(false);
  });
});
