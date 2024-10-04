import axios from "axios";
import { ResponseModel } from "../Domain/Core/Entity/ResponseModel";
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
      } else {
        console.error("Unexpected error:", error);
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

        return response;
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query the user with id: ${userId}, please try again later.`
        );
      }
    });
};
