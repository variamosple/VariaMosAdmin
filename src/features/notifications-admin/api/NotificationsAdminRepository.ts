import type { ResponseModel } from "@variamosple/variamos-components";
import * as z from "zod/mini";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

const recipientCountSchema = z.looseObject({ count: z.number() });

export interface DispatchNotificationRequest {
  audience: "broadcast" | "role" | "users";
  roles?: string[];
  userIds?: string[];
  title: string;
  body: string;
}

export const dispatchNotification = (
  request: DispatchNotificationRequest,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to dispatch notification, please try again later.";
  return ADMIN_CLIENT.post("/v1/admin/notifications/dispatch", request)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

/** How many active accounts a dispatch would reach; nothing is sent. */
export const countNotificationRecipients = (
  request: Pick<DispatchNotificationRequest, "audience" | "roles" | "userIds">,
): Promise<ResponseModel<{ count: number }>> => {
  const failure =
    "Error when trying to count the recipients, please try again later.";
  return ADMIN_CLIENT.post("/v1/admin/notifications/recipients/count", request)
    .then((response) =>
      parseResponse(recipientCountSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};
