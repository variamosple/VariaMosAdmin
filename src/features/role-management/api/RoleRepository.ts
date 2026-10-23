import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { Role } from "../domain/Entity/Role";
import type { RolesFilter } from "../domain/Entity/RolesFilter";

export const queryRoles = (
  filter: RolesFilter,
): Promise<ResponseModel<Role[]>> => {
  return ADMIN_CLIENT.get("/v1/roles", { params: filter })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query roles, please try again later.",
      ),
    );
};

export const createRole = (request: Role): Promise<ResponseModel<Role>> => {
  return ADMIN_CLIENT.post("/v1/roles", request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to create the role, please try again later.",
      ),
    );
};

export const deleteRole = (roleId: number): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(`/v1/roles/${roleId}`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to delete the role, please try again later.",
      ),
    );
};

export const queryRoleById = (roleId: number): Promise<ResponseModel<Role>> => {
  return ADMIN_CLIENT.get(`/v1/roles/${roleId}`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to query the role with id: ${roleId}, please try again later.`,
      ),
    );
};

export const updateRole = (request: Role): Promise<ResponseModel<Role>> => {
  return ADMIN_CLIENT.put(`/v1/roles/${request.id}`, request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to update the role with id: ${request.id}, please try again later.`,
      ),
    );
};
