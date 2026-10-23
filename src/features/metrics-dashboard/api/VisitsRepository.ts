import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

export const registerVisit = (pageId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post(`/v1/visits`, { pageId })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying register the visit, please try again later.",
      ),
    );
};
