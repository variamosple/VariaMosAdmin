import type { ResponseModel } from "@variamosple/variamos-components";
import { permissionsSchema } from "@/features/permission-management/api/permissionSchemas";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import type { RolePermission } from "@/features/role-management/domain/Entity/RolePermission";
import type { RolePermissionFilter } from "@/features/role-management/domain/Entity/RolePermissionFilter";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import { rolePermissionSchema } from "./roleSchemas";

export const queryRolePermissions = (
  filter: RolePermissionFilter,
): Promise<ResponseModel<Permission[]>> => {
  const failure =
    "Error when trying to query role permissions, please try again later.";
  return ADMIN_CLIENT.get(`/v1/roles/${filter.roleId}/permissions`, {
    params: filter,
  })
    .then((response) =>
      parseResponse(permissionsSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

export const createRolePermission = (
  request: RolePermission,
): Promise<ResponseModel<RolePermission>> => {
  const failure =
    "Error when trying to create the role and permission association, please try again later.";
  return ADMIN_CLIENT.post(`/v1/roles/${request.roleId}/permissions`, request)
    .then((response) =>
      parseResponse(rolePermissionSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

export const deleteRolePermission = (
  request: RolePermission,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to delete the role and permission association, please try again later.";
  return ADMIN_CLIENT.delete(
    `/v1/roles/${request.roleId}/permissions/${request.permissionId}`,
  )
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
