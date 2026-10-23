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
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
