import type { ResponseModel } from "@variamosple/variamos-components";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { MicroService } from "../domain/Entity/MicroService";
import type { MicroServiceFilter } from "../domain/Entity/MicroServiceFilter";
import { configItemSchema, configItemsSchema } from "./microServiceSchemas";

export const queryMicroServices = (
  filter: MicroServiceFilter,
): Promise<ResponseModel<MicroService[]>> => {
  return ADMIN_CLIENT.get("/v1/micro-services", { params: filter })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query micro services, please try again later.",
      ),
    );
};

export const startMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to start the microservice, please try again later.";
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/start`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const restartMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to restart the microservice, please try again later.";
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/restart`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const stopMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to stop the microservice, please try again later.";
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/stop`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const getMicroServiceConfigurations = (
  serviceName: string,
): Promise<
  ResponseModel<
    import("../domain/Entity/MicroService").MicroServiceConfigItem[]
  >
> => {
  const failure = "Unexpected error";
  return ADMIN_CLIENT.get(`/v1/micro-services/${serviceName}/configurations`)
    .then((response) =>
      parseResponse(configItemsSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

export const updateMicroServiceConfiguration = (
  serviceName: string,
  key: string,
  value: string,
): Promise<
  ResponseModel<import("../domain/Entity/MicroService").MicroServiceConfigItem>
> => {
  const failure = "Unexpected error";
  return ADMIN_CLIENT.put(
    `/v1/micro-services/${serviceName}/configurations/${key}`,
    { value },
  )
    .then((response) => parseResponse(configItemSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const getMicroServiceAuditLogs = (
  serviceName: string,
  limit: number = 50,
): Promise<
  ResponseModel<
    import("../domain/Entity/MicroService").MicroServiceAuditEntry[]
  >
> => {
  return ADMIN_CLIENT.get(`/v1/micro-services/${serviceName}/audit-logs`, {
    params: { limit },
  })
    .then((response) => response.data)
    .catch((error) => toErrorResponse(error, "Unexpected error"));
};

export const watchMicroserviceLogs = (): WebSocket => {
  return new WebSocket(AppConfig.ADMIN_WS_URL);
};

export const triggerMicroServicesCheck = (
  serviceName?: string,
): Promise<ResponseModel<void>> => {
  const failure = "Unexpected error";
  return ADMIN_CLIENT.post("/v1/micro-services/check", { serviceName })
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
