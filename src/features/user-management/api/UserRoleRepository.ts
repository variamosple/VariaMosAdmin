import type { ResponseModel } from "@variamosple/variamos-components";
import {
  roleDetailsSchema,
  rolesSchema,
} from "@/features/role-management/api/roleSchemas";
import type {
  Role,
  RoleDetails,
} from "@/features/role-management/domain/Entity/Role";
import type { UserRole } from "@/features/user-management/domain/Entity/UserRole";
import type { UserRoleFilter } from "@/features/user-management/domain/Entity/UserRoleFilter";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import { userRoleSchema } from "./userRoleSchemas";

export const queryUserRoles = (
  filter: UserRoleFilter,
): Promise<ResponseModel<Role[]>> => {
  const failure =
    "Error when trying to query the user roles, please try again later.";
  return ADMIN_CLIENT.get(`/v1/users/${filter.userId}/roles`, {
    params: filter,
  })
    .then((response) => parseResponse(rolesSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const queryUserRolesDetails = (
  filter: UserRoleFilter,
): Promise<ResponseModel<RoleDetails[]>> => {
  const failure =
    "Error when trying to query the user roles with details, please try again later.";
  return ADMIN_CLIENT.get(`/v1/users/${filter.userId}/roles/details`)
    .then((response) =>
      parseResponse(roleDetailsSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

export const createUserRole = (
  request: UserRole,
): Promise<ResponseModel<UserRole>> => {
  const failure =
    "Error when trying to create the user and role association, please try again later.";
  return ADMIN_CLIENT.post(`/v1/users/${request.userId}/roles`, request)
    .then((response) => parseResponse(userRoleSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const deleteUserRole = (
  request: UserRole,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to delete the user and role association, please try again later.";
  return ADMIN_CLIENT.delete(
    `/v1/users/${request.userId}/roles/${request.roleId}`,
  )
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
