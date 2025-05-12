import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";

import { Model } from "@/Domain/Model/Model";
import { ModelsFilter } from "@/Domain/Model/ModelFilter";
import { PROJECTS_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryModels = (
  filter: ModelsFilter
): Promise<ResponseModel<Model[]>> => {
  return PROJECTS_CLIENT.get("/v1/admin/models", { params: filter })
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
          `Error when trying to query model, please try again later.`
        );
      }
    });
};

export const deleteModel = (modelId: string): Promise<ResponseModel<void>> => {
  return PROJECTS_CLIENT.delete(`/v1/admin/models/${modelId}`)
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
          "Error when trying to delete the model, please try again later."
        );
      }
    });
};

export const queryModelById = (
  modelId: number
): Promise<ResponseModel<Model>> => {
  return PROJECTS_CLIENT.get(`/v1/admin/models/${modelId}`)
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
          `Error when trying to query the model with id: ${modelId}, please try again later.`
        );
      }
    });
};

export const updateModel = (request: Model): Promise<ResponseModel<Model>> => {
  return PROJECTS_CLIENT.put(`/v1/admin/models/${request.id}`, request)
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
          `Error when trying to update the model with id: ${request.id}, please try again later.`
        );
      }
    });
};
