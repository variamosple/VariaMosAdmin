import type { Menu, ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

export const requestMenuConfig = (): Promise<ResponseModel<Menu>> => {
  return ADMIN_CLIENT.get(`/v1/configurations/menu`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query menu config, please try again later.",
      ),
    );
};
