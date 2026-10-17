import {
  DEFAULT_PASSWORD_POLICY,
  describePasswordPolicy,
  isPasswordAllowed,
} from "./PasswordPolicy";

describe("PasswordPolicy", () => {
  it.each([
    ["SecurePass123!", true],
    ["SecurePass123#", true],
    ["Café1!Bar🔒", true],
    ["Short1!", false],
    ["NoNumber!!", false],
    ["NoSpecial12", false],
    ["lowercase1!", false],
    ["UPPERCASE12!", false],
    [`${"Aa1!".repeat(16)}x`, false],
  ])("default policy: %s allowed is %s", (password, expected) => {
    expect(isPasswordAllowed(DEFAULT_PASSWORD_POLICY, password)).toBe(expected);
  });

  it("follows a configured policy", () => {
    const policy = {
      ...DEFAULT_PASSWORD_POLICY,
      minLength: 12,
      requireSpecial: false,
    };

    expect(isPasswordAllowed(policy, "Password1234")).toBe(true);
    expect(isPasswordAllowed(policy, "Password12")).toBe(false);
    expect(describePasswordPolicy(policy)).toBe(
      "Password must be between 12 and 64 characters long and contain uppercase, lowercase, and number.",
    );
  });

  it("states the default rule as the server does", () => {
    expect(describePasswordPolicy(DEFAULT_PASSWORD_POLICY)).toBe(
      "Password must be between 8 and 64 characters long and contain uppercase, lowercase, number, and special character.",
    );
  });
});
