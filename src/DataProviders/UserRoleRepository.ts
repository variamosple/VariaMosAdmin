import { UserRole } from "@/Domain/User/Entity/UserRole";
import { UserRoleFilter } from "@/Domain/User/Entity/UserRoleFilter";
import axios from "axios";
import { ResponseModel } from "variamos-components";
import { Role, RoleDetails } from "../Domain/Role/Entity/Role";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryUserRoles = (
  filter: UserRoleFilter
): Promise<ResponseModel<Role[]>> => {
  return ADMIN_CLIENT.get(`/v1/users/${filter.userId}/roles`, {
    params: filter,
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
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to query the user roles, please try again later."
        );
      }
    });
};

export const queryUserRolesDetails = (
  filter: UserRoleFilter
): Promise<ResponseModel<RoleDetails[]>> => {
  return ADMIN_CLIENT.get(`/v1/users/${filter.userId}/roles/details`)
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
          "Error when trying to query the user roles with details, please try again later."
        );
      }
    });
};

export const createUserRole = (
  request: UserRole
): Promise<ResponseModel<UserRole>> => {
  return ADMIN_CLIENT.post(`/v1/users/${request.userId}/roles`, request)
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
          "Error when trying to create the user and role association, please try again later."
        );
      }
    });
};

export const deleteUserRole = (
  request: UserRole
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(
    `/v1/users/${request.userId}/roles/${request.roleId}`
  )
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
          "Error when trying to delete the user and role association, please try again later."
        );
      }
    });
};
