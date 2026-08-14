import {
  ResponseModel,
  type SessionInfoResponse,
  type singInResponse,
} from "@variamosple/variamos-components";
import axios from "axios";
import type { Credentials } from "@/features/user-management/domain/Entity/Credentials";
import type { PasswordUpdate } from "@/features/user-management/domain/Entity/PasswordUpdate";
import type { PersonalInformationUpdate } from "@/features/user-management/domain/Entity/PersonalInformationUpdate";
import type { User } from "@/features/user-management/domain/Entity/User";
import type { UserRegistration } from "@/features/user-management/domain/Entity/UserRegistration";
import { handleRepositoryError } from "@/shared/api/RepositoryUtils";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

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
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to get session info, please try again later.",
        );
      }
    });
};

export const requestLogout = (): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/logout")
    .then(() => {})
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to logout, please try again later.",
        );
      }
    });
};

export const requestSignIn = (
  request: Credentials,
): Promise<ResponseModel<singInResponse>> => {
  return ADMIN_CLIENT.post("/auth/sign-in", request)
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to sign in, please try again later.",
        );
      }
    });
};

export const requestSignInAsGuest = (
  guestId?: string | null,
): Promise<ResponseModel<singInResponse>> => {
  return ADMIN_CLIENT.post("/auth/guest/sign-in", { guestId })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to sign in as guest, please try again later.",
        );
      }
    });
};

export const requestSignUp = (
  request: UserRegistration,
): Promise<ResponseModel<unknown>> => {
  return ADMIN_CLIENT.post("/auth/sign-up", request)
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to sign up, please try again later.",
        );
      }
    });
};

export const getMyAccount = (): Promise<ResponseModel<User>> => {
  return ADMIN_CLIENT.get("/auth/my-account")
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to get account details, please try again later.",
        );
      }
    });
};

export const updatePersonalInformation = (
  personalInformation: PersonalInformationUpdate,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put("/auth/my-account/information", personalInformation)
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to get account details, please try again later.",
        );
      }
    });
};

export const updateUserPassword = (
  passwordUpdate: PasswordUpdate,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put("/auth/password-update", passwordUpdate)
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to update password, please try again later.",
        );
      }
    });
};

export const registerRedirect = (url: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/redirects", { url })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return Object.assign(new ResponseModel(), response);
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Error when communicating with the back-end.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to register redirect, please try again later.",
        );
      }
    });
};

export const requestPasswordReset = (
  email: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/forgot-password", { email })
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      handleRepositoryError(
        error,
        "Error when trying to request password reset, please try again later.",
      ),
    );
};

export const verifyPasswordResetToken = (
  token: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.get(
    `/auth/verify-token?token=${token}&_t=${Date.now()}`,
    {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
  )
    .then((response) => Object.assign(new ResponseModel(), response.data))
    .catch((error) =>
      handleRepositoryError(
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
      handleRepositoryError(
        error,
        "Error when trying to reset password, please try again later.",
      ),
    );
};
