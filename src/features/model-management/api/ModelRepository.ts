import type { ResponseModel } from "@variamosple/variamos-components";

import type { Model } from "@/features/model-management/domain/Entity/Model";
import type { ModelsFilter } from "@/features/model-management/domain/Entity/ModelFilter";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { PROJECTS_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import { modelSchema, modelsSchema } from "./modelSchemas";

export const queryModels = (
  filter: ModelsFilter,
): Promise<ResponseModel<Model[]>> => {
  const failure = "Error when trying to query model, please try again later.";
  return PROJECTS_CLIENT.get("/v1/admin/models", { params: filter })
    .then((response) => parseResponse(modelsSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const deleteModel = (modelId: string): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to delete the model, please try again later.";
  return PROJECTS_CLIENT.delete(`/v1/admin/models/${modelId}`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const updateModel = (request: Model): Promise<ResponseModel<Model>> => {
  const failure = `Error when trying to update the model with id: ${request.id}, please try again later.`;
  return PROJECTS_CLIENT.put(`/v1/admin/models/${request.id}`, request)
    .then((response) => parseResponse(modelSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const createModel = (request: Model): Promise<ResponseModel<Model>> => {
  const failure =
    "Error when trying to create the model, please try again later.";
  return PROJECTS_CLIENT.post("/v1/admin/models", request)
    .then((response) => parseResponse(modelSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
