import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";

import { Country } from "@/Domain/Country/Country";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryCountries = (): Promise<ResponseModel<Country[]>> => {
  return ADMIN_CLIENT.get(`/v1/countries`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query countries, please try again later.`
        );
      }
    });
};
