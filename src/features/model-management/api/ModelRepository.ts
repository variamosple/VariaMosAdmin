import type { ResponseModel } from "@variamosple/variamos-components";

import type { Model } from "@/features/model-management/domain/Entity/Model";
import type { ModelsFilter } from "@/features/model-management/domain/Entity/ModelFilter";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { PROJECTS_CLIENT } from "@/shared/infrastructure/AxiosConfig";

export const queryModels = (
  filter: ModelsFilter,
): Promise<ResponseModel<Model[]>> => {
  return PROJECTS_CLIENT.get("/v1/admin/models", { params: filter })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query model, please try again later.",
      ),
    );
};

export const deleteModel = (modelId: string): Promise<ResponseModel<void>> => {
  return PROJECTS_CLIENT.delete(`/v1/admin/models/${modelId}`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to delete the model, please try again later.",
      ),
    );
};

export const updateModel = (request: Model): Promise<ResponseModel<Model>> => {
  return PROJECTS_CLIENT.put(`/v1/admin/models/${request.id}`, request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to update the model with id: ${request.id}, please try again later.`,
      ),
    );
};

export const createModel = (request: Model): Promise<ResponseModel<Model>> => {
  return PROJECTS_CLIENT.post("/v1/admin/models", request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to create the model, please try again later.",
      ),
    );
};
