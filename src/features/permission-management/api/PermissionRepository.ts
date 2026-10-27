import type { ResponseModel } from "@variamosple/variamos-components";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { Permission } from "../domain/Entity/Permission";
import type { PermissionsFilter } from "../domain/Entity/PermissionsFilter";
import { permissionSchema, permissionsSchema } from "./permissionSchemas";

export const queryPermissions = (
  filter: PermissionsFilter,
): Promise<ResponseModel<Permission[]>> => {
  const failure =
    "Error when trying to query permissions, please try again later.";
  return ADMIN_CLIENT.get("/v1/permissions", { params: filter })
    .then((response) =>
      parseResponse(permissionsSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

export const createPermission = (
  request: Permission,
): Promise<ResponseModel<Permission>> => {
  const failure =
    "Error when trying to create the permission, please try again later.";
  return ADMIN_CLIENT.post("/v1/permissions", request)
    .then((response) => parseResponse(permissionSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const deletePermission = (
  permissionId: number,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to delete the permission, please try again later.";
  return ADMIN_CLIENT.delete(`/v1/permissions/${permissionId}`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

// ARCHIVED: Unused in frontend currently
// export const queryPermissionById = (permissionId: number): Promise<ResponseModel<Permission>> => {
//   return ADMIN_CLIENT.get(`/v1/permissions/${permissionId}`)
//     .then((response) => response.data)
//     .catch((error) => {
//       if (axios.isAxiosError(error)) {
//         console.error("Axios error:", error.message);
//
//         const response = error.response?.data;
//
//         if (!!response) {
//           return response;
//         }
//
//         return new ResponseModel("BACK-ERROR").withError(
//           Number.parseInt(error.code || "500"),
//           "Network/communication error.",
//         );
//       } else {
//         console.error("Unexpected error:", error);
//
//         return new ResponseModel("APP-ERROR").withError(
//           500,
//           `Error when trying to query the permission with id: ${permissionId}, please try again later.`,
//         );
//       }
//     });
// };

export const updatePermission = (
  request: Permission,
): Promise<ResponseModel<Permission>> => {
  const failure = `Error when trying to update the permission with id: ${request.id}, please try again later.`;
  return ADMIN_CLIENT.put(`/v1/permissions/${request.id}`, request)
    .then((response) => parseResponse(permissionSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
