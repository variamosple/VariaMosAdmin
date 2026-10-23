import { type ErrorCode, ErrorCodes } from "./errorCodes";

/** Shown for any server error: its detail stays in the server log. */
export const SYSTEM_ERROR_MESSAGE =
  "An error occurred. Please try again or contact the administrator.";

/** Shown when no answer came back, or only the proxy answered. */
export const UNREACHABLE_MESSAGE =
  "The server cannot be reached. Check your connection and try again.";

// Expected errors: the API message is meant for the user and is kept; this
// one is shown when the API sent none
const EXPECTED_ERROR_MESSAGES: Record<
  Exclude<ErrorCode, typeof ErrorCodes.SYSTEM_ERROR>,
  string
> = {
  INVALID_INPUT: "The request is not valid. Check the form and try again.",
  ENTITY_NOT_FOUND: "This item no longer exists.",
  UNAUTHORIZED_ACCESS: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to do this.",
  DUPLICATE_ENTITY: "This item already exists.",
  MFA_REQUIRED: "Enter the code from your authenticator app.",
  TOO_MANY_REQUESTS: "Too many attempts. Please wait a moment and try again.",
  UNAVAILABLE: "This feature is not available right now.",
  PASSWORD_REUSED: "The new password must be different from the current one.",
};

// For services that answer an HTTP status instead of a code
const CODE_OF_STATUS: Record<number, keyof typeof EXPECTED_ERROR_MESSAGES> = {
  400: ErrorCodes.INVALID_INPUT,
  401: ErrorCodes.UNAUTHORIZED_ACCESS,
  403: ErrorCodes.FORBIDDEN,
  404: ErrorCodes.ENTITY_NOT_FOUND,
  409: ErrorCodes.DUPLICATE_ENTITY,
  429: ErrorCodes.TOO_MANY_REQUESTS,
};

const isExpectedCode = (
  code: number | string | undefined,
): code is keyof typeof EXPECTED_ERROR_MESSAGES =>
  typeof code === "string" && code in EXPECTED_ERROR_MESSAGES;

/**
 * The message to show for an error answered by a server (T-16): the API
 * message for an expected error, a generic one for a server error.
 */
export const errorMessageOf = (
  status: number,
  errorCode: number | string | undefined,
  apiMessage: string | undefined,
): string => {
  if (isExpectedCode(errorCode)) {
    return apiMessage || EXPECTED_ERROR_MESSAGES[errorCode];
  }
  if (status >= 500 || errorCode === ErrorCodes.SYSTEM_ERROR) {
    return SYSTEM_ERROR_MESSAGE;
  }
  return (
    apiMessage ||
    EXPECTED_ERROR_MESSAGES[CODE_OF_STATUS[status] ?? ErrorCodes.INVALID_INPUT]
  );
};

/** Why the login page was opened, passed as `/login?reason=`. */
export const LOGIN_REASON_MESSAGES = {
  "session-expired": "Your session has ended. Please sign in again.",
  "sign-in-failed": "Sign-in failed. Please try again.",
  "account-inactive": "This account is not active. Contact an administrator.",
} as const;

export type LoginReason = keyof typeof LOGIN_REASON_MESSAGES;

/**
 * The message of the login page. An old `errorMessage` link gets the
 * generic one: a text read from the address is never shown.
 */
export const loginMessageOf = (params: URLSearchParams): string | undefined => {
  const reason = params.get("reason");
  if (reason && reason in LOGIN_REASON_MESSAGES) {
    return LOGIN_REASON_MESSAGES[reason as LoginReason];
  }
  if (reason || params.has("errorMessage")) {
    return LOGIN_REASON_MESSAGES["sign-in-failed"];
  }
  return undefined;
};
