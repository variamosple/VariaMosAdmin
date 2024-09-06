import axios from "axios";
import { ResponseModel } from "../Domain/Core/Entity/ResponseModel";
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
      } else {
        console.error("Unexpected error:", error);
      }
    });
};
