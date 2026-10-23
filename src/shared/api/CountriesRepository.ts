import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import type { Country } from "@/shared/domain/Entity/Country";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

export const queryCountries = (): Promise<ResponseModel<Country[]>> => {
  return ADMIN_CLIENT.get(`/v1/countries`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query countries, please try again later.",
      ),
    );
};
