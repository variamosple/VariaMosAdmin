import type { ResponseModel } from "@variamosple/variamos-components";
import type {
  Role,
  RoleDetails,
} from "@/features/role-management/domain/Entity/Role";
import type { UserRole } from "@/features/user-management/domain/Entity/UserRole";
import type { UserRoleFilter } from "@/features/user-management/domain/Entity/UserRoleFilter";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

export const queryUserRoles = (
  filter: UserRoleFilter,
): Promise<ResponseModel<Role[]>> => {
  return ADMIN_CLIENT.get(`/v1/users/${filter.userId}/roles`, {
    params: filter,
  })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query the user roles, please try again later.",
      ),
    );
};

export const queryUserRolesDetails = (
  filter: UserRoleFilter,
): Promise<ResponseModel<RoleDetails[]>> => {
  return ADMIN_CLIENT.get(`/v1/users/${filter.userId}/roles/details`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query the user roles with details, please try again later.",
      ),
    );
};

export const createUserRole = (
  request: UserRole,
): Promise<ResponseModel<UserRole>> => {
  return ADMIN_CLIENT.post(`/v1/users/${request.userId}/roles`, request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to create the user and role association, please try again later.",
      ),
    );
};

export const deleteUserRole = (
  request: UserRole,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(
    `/v1/users/${request.userId}/roles/${request.roleId}`,
  )
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to delete the user and role association, please try again later.",
      ),
    );
};
