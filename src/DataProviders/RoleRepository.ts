import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
import { Role } from "../Domain/Role/Entity/Role";
import { RolesFilter } from "../Domain/Role/Entity/RolesFilter";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryRoles = (
  filter: RolesFilter
): Promise<ResponseModel<Role[]>> => {
  return ADMIN_CLIENT.get("/v1/roles", { params: filter })
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
          `Error when trying to query roles, please try again later.`
        );
      }
    });
};

export const createRole = (request: Role): Promise<ResponseModel<Role>> => {
  return ADMIN_CLIENT.post("/v1/roles", request)
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
          "Error when trying to create the role, please try again later."
        );
      }
    });
};

export const deleteRole = (roleId: number): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(`/v1/roles/${roleId}`)
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
          "Error when trying to delete the role, please try again later."
        );
      }
    });
};

export const queryRoleById = (roleId: number): Promise<ResponseModel<Role>> => {
  return ADMIN_CLIENT.get(`/v1/roles/${roleId}`)
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
          `Error when trying to query the role with id: ${roleId}, please try again later.`
        );
      }
    });
};

export const updateRole = (request: Role): Promise<ResponseModel<Role>> => {
  return ADMIN_CLIENT.put(`/v1/roles/${request.id}`, request)
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
          `Error when trying to update the role with id: ${request.id}, please try again later.`
        );
      }
    });
};
