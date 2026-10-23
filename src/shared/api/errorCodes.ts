/**
 * Error codes of the admin API, mirror of `DomainErrorCodes` in
 * variamos_ms_admin. Other services may still answer an HTTP status.
 */
export const ErrorCodes = {
  INVALID_INPUT: "INVALID_INPUT",
  ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  FORBIDDEN: "FORBIDDEN",
  SYSTEM_ERROR: "SYSTEM_ERROR",
  DUPLICATE_ENTITY: "DUPLICATE_ENTITY",
  MFA_REQUIRED: "MFA_REQUIRED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  UNAVAILABLE: "UNAVAILABLE",
  PASSWORD_REUSED: "PASSWORD_REUSED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Whether a response carries this code. The shared ResponseModel types
 * errorCode as a number, but the admin API sends these strings.
 */
export const isErrorCode = (
  errorCode: number | string | null | undefined,
  code: ErrorCode,
): boolean => errorCode === code;
