import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type {
  Configuration,
  ConfigurationValue,
} from "../domain/Entity/Configuration";

export const queryConfigurations = (): Promise<
  ResponseModel<Configuration[]>
> => {
  return ADMIN_CLIENT.get("/v1/configurations")
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query configurations, please try again later.",
      ),
    );
};

export const updateConfiguration = (
  key: string,
  value: ConfigurationValue,
): Promise<ResponseModel<Configuration>> => {
  return ADMIN_CLIENT.put(`/v1/configurations/${key}`, { value })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to update configuration '${key}', please try again later.`,
      ),
    );
};

/** What the form sends to create a setting (EV-18 lot C.3). */
export type NewConfiguration = Pick<
  Configuration,
  "key" | "value" | "type" | "category" | "isSecret" | "description"
>;

export const createConfiguration = (
  configuration: NewConfiguration,
): Promise<ResponseModel<Configuration>> => {
  return ADMIN_CLIENT.post("/v1/configurations", configuration)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to create configuration '${configuration.key}', please try again later.`,
      ),
    );
};
