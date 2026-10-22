/** Whether another account has a second factor (administrators only). */
export interface AccountMfaStatus {
  enabled: boolean;
}

export interface AccountMfaReset {
  /** False when the owner could not be told by e-mail. */
  emailSent: boolean;
}
