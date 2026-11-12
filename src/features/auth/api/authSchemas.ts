import type { singInResponse } from "@variamosple/variamos-components";
import * as z from "zod/mini";
import type { PasswordPolicy } from "../domain/PasswordPolicy";

// Answers of the authentication routes (EV-97 lot 6c). The session info is
// left out: a wrong schema there would sign every user out

export const signedInSchema: z.ZodMiniType<singInResponse> = z.looseObject({
  id: z.optional(z.string()),
  redirect: z.string(),
});

/** The sign-in answer; `mfaRequired` when the code is still expected. */
export type SignInResult = singInResponse & {
  mfaRequired?: boolean;
  trustedDeviceDays?: number;
};

// The answer that waits for the code opens no page: its redirect is empty
const mfaRequiredSchema = z.pipe(
  z.looseObject({
    mfaRequired: z.literal(true),
    trustedDeviceDays: z.optional(z.number()),
  }),
  z.transform((answer) => ({ ...answer, redirect: "" })),
);

/** A password sign-in either opens the session or waits for the code. */
export const signInSchema: z.ZodMiniType<SignInResult> = z.union([
  signedInSchema,
  mfaRequiredSchema,
]);

export const passwordPolicySchema: z.ZodMiniType<PasswordPolicy> =
  z.looseObject({
    minLength: z.number(),
    maxLength: z.number(),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecial: z.boolean(),
  });
