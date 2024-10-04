import { RolePermission } from "@/Domain/Role/Entity/RolePermission";
import { RolePermissionFilter } from "@/Domain/Role/Entity/RolePermissionFilter";
import axios from "axios";
import { ResponseModel } from "../Domain/Core/Entity/ResponseModel";
import { Permission } from "../Domain/Permission/Entity/Permission";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryRolePermissions = (
  filter: RolePermissionFilter
): Promise<ResponseModel<Permission[]>> => {
  return ADMIN_CLIENT.get(`/v1/roles/${filter.roleId}/permissions`, {
    params: filter,
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

export const createRolePermission = (
  request: RolePermission
): Promise<ResponseModel<RolePermission>> => {
  return ADMIN_CLIENT.post(`/v1/roles/${request.roleId}/permissions`, request)
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
          "Error when trying to create the role and permission association, please try again later."
        );
      }
    });
};

export const deleteRolePermission = (
  request: RolePermission
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(
    `/v1/roles/${request.roleId}/permissions/${request.permissionId}`
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
          "Error when trying to delete the role and permission association, please try again later."
        );
      }
    });
};
