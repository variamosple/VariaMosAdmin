import axios from "axios";
import { ResponseModel } from "../Domain/Core/Entity/ResponseModel";

import { Metric } from "@/Domain/Metric/Metric";
import { MetricsFilter } from "@/Domain/Metric/MetricsFilter";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryMetrics = (): Promise<ResponseModel<Metric[]>> => {
  return ADMIN_CLIENT.get(`/v1/metrics`)
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
          `Error when trying to query metrics, please try again later.`
        );
      }
    });
};

export const queryMetric = (
  filter: MetricsFilter
): Promise<ResponseModel<Metric>> => {
  return ADMIN_CLIENT.get(`/v1/metrics/${filter.id}`, { params: filter })
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
          `Error when trying to query metric data, please try again later.`
        );
      }
    });
};
