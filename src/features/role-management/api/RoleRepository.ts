import type { ResponseModel } from "@variamosple/variamos-components";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { Role } from "../domain/Entity/Role";
import type { RolesFilter } from "../domain/Entity/RolesFilter";
import { foundRoleSchema, roleSchema, rolesSchema } from "./roleSchemas";

export const queryRoles = (
  filter: RolesFilter,
): Promise<ResponseModel<Role[]>> => {
  const failure = "Error when trying to query roles, please try again later.";
  return ADMIN_CLIENT.get("/v1/roles", { params: filter })
    .then((response) => parseResponse(rolesSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const createRole = (request: Role): Promise<ResponseModel<Role>> => {
  const failure =
    "Error when trying to create the role, please try again later.";
  return ADMIN_CLIENT.post("/v1/roles", request)
    .then((response) => parseResponse(roleSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const deleteRole = (roleId: number): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to delete the role, please try again later.";
  return ADMIN_CLIENT.delete(`/v1/roles/${roleId}`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const queryRoleById = (
  roleId: number,
): Promise<ResponseModel<Role | null>> => {
  const failure = `Error when trying to query the role with id: ${roleId}, please try again later.`;
  return ADMIN_CLIENT.get(`/v1/roles/${roleId}`)
    .then((response) => parseResponse(foundRoleSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const updateRole = (request: Role): Promise<ResponseModel<Role>> => {
  const failure = `Error when trying to update the role with id: ${request.id}, please try again later.`;
  return ADMIN_CLIENT.put(`/v1/roles/${request.id}`, request)
    .then((response) => parseResponse(roleSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
