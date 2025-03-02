import { Credentials } from "@/Domain/User/Entity/Credentials";
import { PasswordUpdate } from "@/Domain/User/Entity/PasswordUpdate";
import { PersonalInformationUpdate } from "@/Domain/User/Entity/PersonalInformationUpdate";
import { User } from "@/Domain/User/Entity/User";
import { UserRegistration } from "@/Domain/User/Entity/UserRegistration";
import axios from "axios";
import {
  ResponseModel,
  SessionUser,
  singInResponse,
} from "variamos-components";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const getSessionInfo = (): Promise<ResponseModel<SessionUser>> => {
  return ADMIN_CLIENT.get("/auth/session-info", {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to get session info, please try again later."
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

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to logout, please try again later."
        );
      }
    });
};

export const requestSignIn = (
  request: Credentials
): Promise<ResponseModel<singInResponse>> => {
  return ADMIN_CLIENT.post("/auth/sign-in", request)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to sign in, please try again later."
        );
      }
    });
};

export const requestSignInAsGuest = (
  guestId?: string | null
): Promise<ResponseModel<singInResponse>> => {
  return ADMIN_CLIENT.post("/auth/guest/sign-in", { guestId })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to sign in as guest, please try again later."
        );
      }
    });
};

export const requestSignUp = (
  request: UserRegistration
): Promise<ResponseModel<unknown>> => {
  return ADMIN_CLIENT.post("/auth/sign-up", request)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to sign up, please try again later."
        );
      }
    });
};

export const getMyAccount = (): Promise<ResponseModel<User>> => {
  return ADMIN_CLIENT.get("/auth/my-account")
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to get account details, please try again later."
        );
      }
    });
};

export const updatePersonalInformation = (
  personalInformation: PersonalInformationUpdate
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put("/auth/my-account/information", personalInformation)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to get account details, please try again later."
        );
      }
    });
};

export const updateUserPassword = (
  passwordUpdate: PasswordUpdate
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put("/auth/password-update", passwordUpdate)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to update password, please try again later."
        );
      }
    });
};

export const registerRedirect = (url: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/redirects", { url })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to register redirect, please try again later."
        );
      }
    });
};
