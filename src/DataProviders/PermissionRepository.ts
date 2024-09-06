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
