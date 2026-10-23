import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { User } from "../domain/Entity/User";
import type { UsersFilter } from "../domain/Entity/UsersFilter";

export const queryUsers = (
  filter: UsersFilter,
): Promise<ResponseModel<User[]>> => {
  return ADMIN_CLIENT.get("/v1/users", { params: filter })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query users, please try again later.",
      ),
    );
};

export const queryUserById = (userId: string): Promise<ResponseModel<User>> => {
  return ADMIN_CLIENT.get(`/v1/users/${userId}`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to query the user with id: ${userId}, please try again later.`,
      ),
    );
};

export const disableUser = (userId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/users/${userId}/disable`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to disable the user with id: ${userId}, please try again later.`,
      ),
    );
};

export const enableUser = (userId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/users/${userId}/enable`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to enable the user with id: ${userId}, please try again later.`,
      ),
    );
};

export const deleteUser = (userId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(`/v1/users/${userId}`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to delete the user with id: ${userId}, please try again later.`,
      ),
    );
};

export const generateRecoveryLink = (
  userId: string,
): Promise<ResponseModel<{ recoveryUrl: string }>> => {
  return ADMIN_CLIENT.post(`/v1/users/${userId}/recovery-link`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to generate recovery link, please try again later.",
      ),
    );
};
