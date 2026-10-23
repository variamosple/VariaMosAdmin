import {
  ResponseModel,
  type SessionInfoResponse,
  type singInResponse,
} from "@variamosple/variamos-components";
import type { Credentials } from "@/features/user-management/domain/Entity/Credentials";
import type { PasswordUpdate } from "@/features/user-management/domain/Entity/PasswordUpdate";
import type { PersonalInformationUpdate } from "@/features/user-management/domain/Entity/PersonalInformationUpdate";
import type { User } from "@/features/user-management/domain/Entity/User";
import type { UserRegistration } from "@/features/user-management/domain/Entity/UserRegistration";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { PasswordPolicy } from "../domain/PasswordPolicy";

export const getSessionInfo = (): Promise<
  ResponseModel<SessionInfoResponse>
> => {
  return ADMIN_CLIENT.get("/auth/session-info", {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to get session info, please try again later.",
      ),
    );
};

export const requestLogout = (): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/logout")
    .then(() => new ResponseModel<void>())
    .catch((error) =>
      toErrorResponse<void>(
        error,
        "Error when trying to logout, please try again later.",
      ),
    );
};

/** The sign-in answer; `mfaRequired` when the code is still expected. */
export type SignInResult = singInResponse & { mfaRequired?: boolean };

/**
 * Set on a sign-in that waits for the second factor: without a session yet,
 * an error code stops the session library before it asks for one.
 */
export const MFA_REQUIRED_CODE = 428;

export const requestSignIn = (
  request: Credentials,
): Promise<ResponseModel<SignInResult>> => {
  return ADMIN_CLIENT.post("/auth/sign-in", request)
    .then((response) => {
      const result: ResponseModel<SignInResult> = Object.assign(
        new ResponseModel(),
        response.data,
      );
      if (result.data?.mfaRequired) {
        result.errorCode = MFA_REQUIRED_CODE;
      }
      return result;
    })
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to sign in, please try again later.",
      ),
    );
};

export const requestSignInAsGuest = (
  guestId?: string | null,
): Promise<ResponseModel<singInResponse>> => {
  return ADMIN_CLIENT.post("/auth/guest/sign-in", { guestId })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to sign in as guest, please try again later.",
      ),
    );
};

export const requestSignUp = (
  request: UserRegistration,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/sign-up", request)
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to sign up, please try again later.",
      ),
    );
};

export const getMyAccount = (): Promise<ResponseModel<User>> => {
  return ADMIN_CLIENT.get("/auth/my-account")
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to get account details, please try again later.",
      ),
    );
};

export const updatePersonalInformation = (
  personalInformation: PersonalInformationUpdate,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put("/auth/my-account/information", personalInformation)
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to get account details, please try again later.",
      ),
    );
};

export const updateUserPassword = (
  passwordUpdate: PasswordUpdate,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put("/auth/password-update", passwordUpdate)
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to update password, please try again later.",
      ),
    );
};

export const registerRedirect = (url: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/redirects", { url })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to register redirect, please try again later.",
      ),
    );
};

export const getPasswordPolicy = (): Promise<ResponseModel<PasswordPolicy>> => {
  return ADMIN_CLIENT.get("/auth/password-policy")
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(error, "Could not read the password policy."),
    );
};

export const requestPasswordReset = (
  email: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/forgot-password", { email })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to request password reset, please try again later.",
      ),
    );
};

export const verifyPasswordResetToken = (
  token: string,
): Promise<ResponseModel<void>> => {
  // The token goes in the body: it stays out of URLs and access logs
  return ADMIN_CLIENT.post("/auth/verify-token", { token })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to verify token, please try again later.",
      ),
    );
};

export const resetPassword = (
  token: string,
  passwordPlain: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/reset-password", {
    token,
    password: passwordPlain,
  })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to reset password, please try again later.",
      ),
    );
};
