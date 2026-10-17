/**
 * Password policy served by GET /auth/password-policy. The same checks run
 * on the server (variamos_ms_admin PasswordPolicy); the server decides.
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

/** Used until the server answers, or if it cannot be reached. */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = Object.freeze({
  minLength: 8,
  maxLength: 64,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
});

export const isPasswordAllowed = (
  policy: PasswordPolicy,
  password: string,
): boolean => {
  const length = [...password].length;
  return (
    length >= policy.minLength &&
    length <= policy.maxLength &&
    (!policy.requireLowercase || /\p{Ll}/u.test(password)) &&
    (!policy.requireUppercase || /\p{Lu}/u.test(password)) &&
    (!policy.requireNumbers || /\p{Nd}/u.test(password)) &&
    (!policy.requireSpecial || /[^\p{L}\p{Nd}]/u.test(password))
  );
};

/** The rule in one sentence, as the server states it. */
export const describePasswordPolicy = (policy: PasswordPolicy): string => {
  const parts = [
    policy.requireUppercase && "uppercase",
    policy.requireLowercase && "lowercase",
    policy.requireNumbers && "number",
    policy.requireSpecial && "special character",
  ].filter(Boolean) as string[];
  const length = `Password must be between ${policy.minLength} and ${policy.maxLength} characters long`;
  if (parts.length === 0) return `${length}.`;
  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
  return `${length} and contain ${list}.`;
};
