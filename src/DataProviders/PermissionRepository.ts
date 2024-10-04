import axios from "axios";
import { ResponseModel } from "../Domain/Core/Entity/ResponseModel";
import { Permission } from "../Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "../Domain/Permission/Entity/PermissionsFilter";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryPermissions = (
  filter: PermissionsFilter
): Promise<ResponseModel<Permission[]>> => {
  return ADMIN_CLIENT.get("/v1/permissions", { params: filter })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    });
};

export const createPermission = (
  request: Permission
): Promise<ResponseModel<Permission>> => {
  return ADMIN_CLIENT.post("/v1/permissions", request)
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
          "Error when trying to create the permission, please try again later."
        );
      }
    });
};

export const deletePermission = (
  permissionId: number
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(`/v1/permissions/${permissionId}`)
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
          "Error when trying to delete the permission, please try again later."
        );
      }
    });
};

export const queryPermissionById = (
  permissionId: number
): Promise<ResponseModel<Permission>> => {
  return ADMIN_CLIENT.get(`/v1/permissions/${permissionId}`)
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
          `Error when trying to query the permission with id: ${permissionId}, please try again later.`
        );
      }
    });
};

export const updatePermission = (
  request: Permission
): Promise<ResponseModel<Permission>> => {
  return ADMIN_CLIENT.put(`/v1/permissions/${request.id}`, request)
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
          `Error when trying to update the permission with id: ${request.id}, please try again later.`
        );
      }
    });
};
