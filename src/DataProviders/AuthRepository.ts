import { ResponseModel } from "@/Domain/Core/Entity/ResponseModel";
import { Credentials } from "@/Domain/User/Entity/Credentials";
import { User } from "@/Domain/User/Entity/User";
import { UserRegistration } from "@/Domain/User/Entity/UserRegistration";
import axios from "axios";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const getSessionInfo = (): Promise<User> => {
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
      } else {
        console.error("Unexpected error:", error);
      }
    });
};

export const requestLogout = (): Promise<void> => {
  return ADMIN_CLIENT.post("/auth/logout")
    .then(() => {})
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    });
};

export const requestSignIn = (
  request: Credentials
): Promise<ResponseModel<unknown>> => {
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
