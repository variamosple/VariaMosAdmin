import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { MicroService } from "../domain/Entity/MicroService";
import type { MicroServiceFilter } from "../domain/Entity/MicroServiceFilter";

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
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/start`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to start the microservice, please try again later.",
      ),
    );
};

export const restartMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/restart`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to restart the microservice, please try again later.",
      ),
    );
};

export const stopMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/stop`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to stop the microservice, please try again later.",
      ),
    );
};

export const getMicroServiceConfigurations = (
  serviceName: string,
): Promise<
  ResponseModel<
    import("../domain/Entity/MicroService").MicroServiceConfigItem[]
  >
> => {
  return ADMIN_CLIENT.get(`/v1/micro-services/${serviceName}/configurations`)
    .then((response) => response.data)
    .catch((error) => toErrorResponse(error, "Unexpected error"));
};

export const updateMicroServiceConfiguration = (
  serviceName: string,
  key: string,
  value: string,
): Promise<
  ResponseModel<import("../domain/Entity/MicroService").MicroServiceConfigItem>
> => {
  return ADMIN_CLIENT.put(
    `/v1/micro-services/${serviceName}/configurations/${key}`,
    { value },
  )
    .then((response) => response.data)
    .catch((error) => toErrorResponse(error, "Unexpected error"));
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
  return ADMIN_CLIENT.post("/v1/micro-services/check", { serviceName })
    .then((response) => response.data)
    .catch((error) => toErrorResponse(error, "Unexpected error"));
};
