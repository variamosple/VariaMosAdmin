import { mfaStatusSchema, recoveryCodesSchema } from "./mfaSchemas";

describe("two-factor answers (EV-97 phase 2)", () => {
  it("reads the status the server sends", () => {
    expect(
      mfaStatusSchema.safeParse({
        available: true,
        enabled: true,
        recoveryCodesRemaining: 8,
      }).success,
    ).toBe(true);
  });

  // A missing flag would show the factor as off and invite to turn it on
  it("refuses a status without its enabled flag", () => {
    expect(
      mfaStatusSchema.safeParse({ available: true, recoveryCodesRemaining: 0 })
        .success,
    ).toBe(false);
  });

  it("refuses recovery codes that are not a list of texts", () => {
    expect(
      recoveryCodesSchema.safeParse({ recoveryCodes: "1234-5678" }).success,
    ).toBe(false);
  });
});
