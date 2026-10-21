import {
  ResponseModel,
  type singInResponse,
} from "@variamosple/variamos-components";
import { handleRepositoryError } from "@/shared/api/RepositoryUtils";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { MfaEnrollment, MfaRecoveryCodes, MfaStatus } from "../domain/Mfa";

const asResponse = <T>(data: Partial<ResponseModel<T>>): ResponseModel<T> =>
  Object.assign(new ResponseModel<T>(), data);

export const getMfaStatus = (): Promise<ResponseModel<MfaStatus>> =>
  ADMIN_CLIENT.get("/auth/mfa")
    .then((response) => asResponse<MfaStatus>(response.data))
    .catch((error) =>
      handleRepositoryError(
        error,
        "Could not read the two-factor authentication status.",
      ),
    );

export const startMfaEnrollment = (
  password: string,
): Promise<ResponseModel<MfaEnrollment>> =>
  ADMIN_CLIENT.post("/auth/mfa/enrollment", { password })
    .then((response) => asResponse<MfaEnrollment>(response.data))
    .catch((error) =>
      handleRepositoryError(
        error,
        "Could not start the two-factor authentication.",
      ),
    );

export const confirmMfaEnrollment = (
  code: string,
): Promise<ResponseModel<MfaRecoveryCodes>> =>
  ADMIN_CLIENT.post("/auth/mfa/enrollment/confirm", { code })
    .then((response) => asResponse<MfaRecoveryCodes>(response.data))
    .catch((error) =>
      handleRepositoryError(
        error,
        "Could not turn on the two-factor authentication.",
      ),
    );

export const disableMfa = (
  password: string,
  code: string,
): Promise<ResponseModel<void>> =>
  ADMIN_CLIENT.post("/auth/mfa/disable", { password, code })
    .then((response) => asResponse<void>(response.data))
    .catch((error) =>
      handleRepositoryError(
        error,
        "Could not turn off the two-factor authentication.",
      ),
    );

/** The code after the password; opens the session when it is right. */
export const requestSignInMfa = (
  code: string,
): Promise<ResponseModel<singInResponse>> =>
  ADMIN_CLIENT.post("/auth/sign-in/mfa", { code })
    .then((response) => asResponse<singInResponse>(response.data))
    .catch((error) =>
      handleRepositoryError(error, "Could not check the code."),
    );
