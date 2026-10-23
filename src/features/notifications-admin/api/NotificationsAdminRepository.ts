import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

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
  return ADMIN_CLIENT.post("/v1/admin/notifications/dispatch", request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to dispatch notification, please try again later.",
      ),
    );
};
