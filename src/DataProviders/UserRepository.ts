import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
import { User } from "../Domain/User/Entity/User";
import { UsersFilter } from "../Domain/User/Entity/UsersFilter";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryUsers = (
  filter: UsersFilter
): Promise<ResponseModel<User[]>> => {
  return ADMIN_CLIENT.get("/v1/users", { params: filter })
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
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query users, please try again later.`
        );
      }
    });
};

export const queryUserById = (userId: string): Promise<ResponseModel<User>> => {
  return ADMIN_CLIENT.get(`/v1/users/${userId}`)
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
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query the user with id: ${userId}, please try again later.`
        );
      }
    });
};

export const disableUser = (userId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/users/${userId}/disable`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        return response;
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to disable the user with id: ${userId}, please try again later.`
        );
      }
    });
};

export const enableUser = (userId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/users/${userId}/enable`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        return response;
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to enable the user with id: ${userId}, please try again later.`
        );
      }
    });
};

export const deleteUser = (userId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(`/v1/users/${userId}`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        return response;
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to delete the user with id: ${userId}, please try again later.`
        );
      }
    });
};
