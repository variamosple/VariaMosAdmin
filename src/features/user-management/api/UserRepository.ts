import type { ResponseModel } from "@variamosple/variamos-components";
import { parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { User } from "../domain/Entity/User";
import type { UsersFilter } from "../domain/Entity/UsersFilter";
import { recoveryLinkSchema, userSchema, usersSchema } from "./userSchemas";

export const queryUsers = (
  filter: UsersFilter,
): Promise<ResponseModel<User[]>> => {
  const failure = "Error when trying to query users, please try again later.";
  return ADMIN_CLIENT.get("/v1/users", { params: filter })
    .then((response) => parseResponse(usersSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const queryUserById = (userId: string): Promise<ResponseModel<User>> => {
  const failure = `Error when trying to query the user with id: ${userId}, please try again later.`;
  return ADMIN_CLIENT.get(`/v1/users/${userId}`)
    .then((response) => parseResponse(userSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
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
  const failure =
    "Error when trying to generate recovery link, please try again later.";
  return ADMIN_CLIENT.post(`/v1/users/${userId}/recovery-link`)
    .then((response) =>
      parseResponse(recoveryLinkSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};
