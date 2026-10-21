import { ResponseModel } from "@variamosple/variamos-components";
import { handleRepositoryError } from "@/shared/api/RepositoryUtils";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type {
  AccountMfaReset,
  AccountMfaStatus,
} from "../domain/Entity/AccountMfa";

const asResponse = <T>(data: Partial<ResponseModel<T>>): ResponseModel<T> =>
  Object.assign(new ResponseModel<T>(), data);

export const getAccountMfaStatus = (
  userId: string,
): Promise<ResponseModel<AccountMfaStatus>> =>
  ADMIN_CLIENT.get(`/v1/users/${encodeURIComponent(userId)}/mfa`)
    .then((response) => asResponse<AccountMfaStatus>(response.data))
    .catch((error) =>
      handleRepositoryError(
        error,
        "Could not read the two-factor authentication of the user.",
      ),
    );

/** Turns off the second factor of an account whose owner lost it. */
export const resetAccountMfa = (
  userId: string,
): Promise<ResponseModel<AccountMfaReset>> =>
  ADMIN_CLIENT.delete(`/v1/users/${encodeURIComponent(userId)}/mfa`)
    .then((response) => asResponse<AccountMfaReset>(response.data))
    .catch((error) =>
      handleRepositoryError(
        error,
        "Could not turn off the two-factor authentication of the user.",
      ),
    );
