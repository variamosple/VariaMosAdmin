import * as z from "zod/mini";
import type { MfaEnrollment, MfaRecoveryCodes, MfaStatus } from "../domain/Mfa";

// Answers of the two-factor routes of one's own account (EV-97 phase 2)

export const mfaStatusSchema: z.ZodMiniType<MfaStatus> = z.looseObject({
  available: z.boolean(),
  enabled: z.boolean(),
  recoveryCodesRemaining: z.number(),
});

export const mfaEnrollmentSchema: z.ZodMiniType<MfaEnrollment> = z.looseObject({
  otpauthUri: z.string(),
  secret: z.string(),
});

export const recoveryCodesSchema: z.ZodMiniType<MfaRecoveryCodes> =
  z.looseObject({ recoveryCodes: z.array(z.string()) });
