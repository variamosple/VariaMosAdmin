import * as z from "zod/mini";
import type {
  AccountMfaReset,
  AccountMfaStatus,
} from "../domain/Entity/AccountMfa";

// Two-factor answers about another account (EV-97 phase 2)

export const accountMfaStatusSchema: z.ZodMiniType<AccountMfaStatus> =
  z.looseObject({ enabled: z.boolean() });

export const accountMfaResetSchema: z.ZodMiniType<AccountMfaReset> =
  z.looseObject({ emailSent: z.boolean() });
