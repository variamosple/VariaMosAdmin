import axios from "axios";
import { ResponseModel } from "../Domain/Core/Entity/ResponseModel";

import { MicroService } from "@/Domain/MicroService/MicroService";
import { MicroServiceFilter } from "@/Domain/MicroService/MicroServiceFilter";
import { ADMIN_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryMicroServices = (
  filter: MicroServiceFilter
): Promise<ResponseModel<MicroService[]>> => {
  return ADMIN_CLIENT.get("/v1/micro-services", { params: filter })
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
          `Error when trying to query micro services, please try again later.`
        );
      }
    });
};

export const startMicroservice = (
  microserviceId: string
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/start`)
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
          "Error when trying to start the microservice, please try again later."
        );
      }
    });
};

export const restartMicroservice = (
  microserviceId: string
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/restart`)
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
          "Error when trying to restart the microservice, please try again later."
        );
      }
    });
};

export const stopMicroservice = (
  microserviceId: string
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/stop`)
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
          "Error when trying to stop the microservice, please try again later."
        );
      }
    });
};
