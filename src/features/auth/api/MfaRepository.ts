import {
  ResponseModel,
  type singInResponse,
} from "@variamosple/variamos-components";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { MfaEnrollment, MfaRecoveryCodes, MfaStatus } from "../domain/Mfa";
import { signedInSchema } from "./authSchemas";
import {
  mfaEnrollmentSchema,
  mfaStatusSchema,
  recoveryCodesSchema,
} from "./mfaSchemas";

const asResponse = <T>(data: Partial<ResponseModel<T>>): ResponseModel<T> =>
  Object.assign(new ResponseModel<T>(), data);

export const getMfaStatus = (): Promise<ResponseModel<MfaStatus>> => {
  const failure = "Could not read the two-factor authentication status.";
  return ADMIN_CLIENT.get("/auth/mfa")
    .then((response) => parseResponse(mfaStatusSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const startMfaEnrollment = (
  password: string,
): Promise<ResponseModel<MfaEnrollment>> => {
  const failure = "Could not start the two-factor authentication.";
  return ADMIN_CLIENT.post("/auth/mfa/enrollment", { password })
    .then((response) =>
      parseResponse(mfaEnrollmentSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

export const confirmMfaEnrollment = (
  code: string,
): Promise<ResponseModel<MfaRecoveryCodes>> => {
  const failure = "Could not turn on the two-factor authentication.";
  return ADMIN_CLIENT.post("/auth/mfa/enrollment/confirm", { code })
    .then((response) =>
      parseResponse(recoveryCodesSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

export const disableMfa = (
  password: string,
  code: string,
): Promise<ResponseModel<void>> => {
  const failure = "Could not turn off the two-factor authentication.";
  return ADMIN_CLIENT.post("/auth/mfa/disable", { password, code })
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

/**
 * The code after the password; opens the session when it is right. With
 * `rememberDevice`, this browser is not asked the code for a while.
 */
export const requestSignInMfa = (
  code: string,
  rememberDevice = false,
): Promise<ResponseModel<singInResponse>> =>
  ADMIN_CLIENT.post("/auth/sign-in/mfa", { code, rememberDevice })
    .then((response) =>
      parseResponse(signedInSchema, response.data, "Could not check the code."),
    )
    .catch((error) => toErrorResponse(error, "Could not check the code."));

/** Asks the code again on every browser where it was skipped. */
export const forgetTrustedDevices = (): Promise<
  ResponseModel<{ removed: number }>
> =>
  ADMIN_CLIENT.delete("/auth/mfa/trusted-devices")
    .then((response) => asResponse<{ removed: number }>(response.data))
    .catch((error) =>
      toErrorResponse(error, "Could not forget your browsers."),
    );
