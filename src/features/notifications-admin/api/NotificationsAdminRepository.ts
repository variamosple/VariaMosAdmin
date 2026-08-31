import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
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
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error dispatching notification:", error.message);
        const response = error.response?.data;
        if (response) {
          return response;
        }
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error dispatching notification:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to dispatch notification, please try again later.",
        );
      }
    });
};
