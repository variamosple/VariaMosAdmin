import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
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
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const responseData = error.response?.data;
        if (responseData) {
          return responseData;
        }
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Network/communication error.",
        );
      }
      console.error("Unexpected error:", error);
      return new ResponseModel("APP-ERROR").withError(
        500,
        "Error when trying to query configurations, please try again later.",
      );
    });
};

export const updateConfiguration = (
  key: string,
  value: ConfigurationValue,
): Promise<ResponseModel<Configuration>> => {
  return ADMIN_CLIENT.put(`/v1/configurations/${key}`, { value })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const responseData = error.response?.data;
        if (responseData) {
          return responseData;
        }
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Network/communication error.",
        );
      }
      console.error("Unexpected error:", error);
      return new ResponseModel("APP-ERROR").withError(
        500,
        `Error when trying to update configuration '${key}', please try again later.`,
      );
    });
};
