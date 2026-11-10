import type { ResponseModel } from "@variamosple/variamos-components";
import { parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type {
  AccountMfaReset,
  AccountMfaStatus,
} from "../domain/Entity/AccountMfa";
import {
  accountMfaResetSchema,
  accountMfaStatusSchema,
} from "./accountMfaSchemas";

export const getAccountMfaStatus = (
  userId: string,
): Promise<ResponseModel<AccountMfaStatus>> => {
  const failure = "Could not read the two-factor authentication of the user.";
  return ADMIN_CLIENT.get(`/v1/users/${encodeURIComponent(userId)}/mfa`)
    .then((response) =>
      parseResponse(accountMfaStatusSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

/** Turns off the second factor of an account whose owner lost it. */
export const resetAccountMfa = (
  userId: string,
): Promise<ResponseModel<AccountMfaReset>> => {
  const failure =
    "Could not turn off the two-factor authentication of the user.";
  return ADMIN_CLIENT.delete(`/v1/users/${encodeURIComponent(userId)}/mfa`)
    .then((response) =>
      parseResponse(accountMfaResetSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};
