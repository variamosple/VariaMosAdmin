import { ErrorCodes } from "./errorCodes";
import {
  errorMessageOf,
  LOGIN_REASON_MESSAGES,
  loginMessageOf,
  SYSTEM_ERROR_MESSAGE,
} from "./errorMessages";

describe("errorMessageOf", () => {
  it.each(Object.values(ErrorCodes).filter((code) => code !== "SYSTEM_ERROR"))(
    "keeps the API message of the expected error %s",
    (code) => {
      expect(errorMessageOf(400, code, "Written for the user.")).toBe(
        "Written for the user.",
      );
    },
  );

  it.each(Object.values(ErrorCodes).filter((code) => code !== "SYSTEM_ERROR"))(
    "has a message of its own for %s",
    (code) => {
      const message = errorMessageOf(400, code, undefined);

      expect(message).toBeTruthy();
      expect(message).not.toBe(SYSTEM_ERROR_MESSAGE);
    },
  );

  it("keeps the message of an expected error answered with 503", () => {
    expect(
      errorMessageOf(
        503,
        ErrorCodes.UNAVAILABLE,
        "Two-factor authentication is not available yet.",
      ),
    ).toBe("Two-factor authentication is not available yet.");
  });

  it.each([
    [500, ErrorCodes.SYSTEM_ERROR],
    [200, ErrorCodes.SYSTEM_ERROR],
    [500, 500],
    [502, undefined],
    [500, "SOME_NEW_CODE"],
  ])("hides the API message of a server error (%i, %s)", (status, code) => {
    expect(
      errorMessageOf(status, code, 'relation "users" does not exist'),
    ).toBe(SYSTEM_ERROR_MESSAGE);
  });

  it.each([
    [403, "You do not have permission to do this."],
    [404, "This item no longer exists."],
    [429, "Too many attempts. Please wait a moment and try again."],
    [418, "The request is not valid. Check the form and try again."],
  ])(
    "gives a client error %i without message the one of its status",
    (status, message) => {
      expect(errorMessageOf(status, status, undefined)).toBe(message);
    },
  );
});

describe("loginMessageOf", () => {
  it.each(Object.entries(LOGIN_REASON_MESSAGES))(
    "shows the message of the reason %s",
    (reason, message) => {
      expect(loginMessageOf(new URLSearchParams({ reason }))).toBe(message);
    },
  );

  it.each([
    ["an old link", { errorMessage: "Your account is disabled." }],
    [
      "a forged text",
      { errorMessage: "Call +1 555 0100 to unlock your account" },
    ],
    ["an unknown reason", { reason: "Call us now" }],
  ])("never shows a text read from the address: %s", (_label, query) => {
    expect(loginMessageOf(new URLSearchParams(query))).toBe(
      LOGIN_REASON_MESSAGES["sign-in-failed"],
    );
  });

  it("shows nothing without reason", () => {
    expect(loginMessageOf(new URLSearchParams())).toBeUndefined();
  });
});
