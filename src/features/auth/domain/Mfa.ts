/** Two-factor authentication of one's own account (SPC-2026-10-17-001). */
export interface MfaStatus {
  /** False while the server has no encryption key. */
  available: boolean;
  enabled: boolean;
  recoveryCodesRemaining: number;
}

export interface MfaEnrollment {
  /** The address the authenticator app reads from the QR code. */
  otpauthUri: string;
  /** The same secret, for apps that cannot scan a QR code. */
  secret: string;
}

export interface MfaRecoveryCodes {
  recoveryCodes: string[];
}
