import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { MicroService } from "../domain/Entity/MicroService";
import type { MicroServiceFilter } from "../domain/Entity/MicroServiceFilter";

export const queryMicroServices = (
  filter: MicroServiceFilter,
): Promise<ResponseModel<MicroService[]>> => {
  return ADMIN_CLIENT.get("/v1/micro-services", { params: filter })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query micro services, please try again later.`,
        );
      }
    });
};

export const startMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/start`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to start the microservice, please try again later.",
        );
      }
    });
};

export const restartMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/restart`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to restart the microservice, please try again later.",
        );
      }
    });
};

export const stopMicroservice = (
  microserviceId: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${microserviceId}/stop`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500", 10),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to stop the microservice, please try again later.",
        );
      }
    });
};

export const getMicroServiceHistory = (
  serviceName: string,
  days: number = 30,
): Promise<
  ResponseModel<
    import("../domain/Entity/MicroService").MicroServiceUptimeSummary
  >
> => {
  return ADMIN_CLIENT.get(`/v1/micro-services/${serviceName}/history`, {
    params: { days },
  })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        return (
          error.response?.data ||
          new ResponseModel("BACK-ERROR").withError(500, "Network error")
        );
      }
      return new ResponseModel("APP-ERROR").withError(500, "Unexpected error");
    });
};

export const scaleMicroservice = (
  serviceName: string,
  replicas: number,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.put(`/v1/micro-services/${serviceName}/scale`, {
    replicas,
  })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        return (
          error.response?.data ||
          new ResponseModel("BACK-ERROR").withError(500, "Network error")
        );
      }
      return new ResponseModel("APP-ERROR").withError(500, "Unexpected error");
    });
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
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        return (
          error.response?.data ||
          new ResponseModel("BACK-ERROR").withError(500, "Network error")
        );
      }
      return new ResponseModel("APP-ERROR").withError(500, "Unexpected error");
    });
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
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        return (
          error.response?.data ||
          new ResponseModel("BACK-ERROR").withError(500, "Network error")
        );
      }
      return new ResponseModel("APP-ERROR").withError(500, "Unexpected error");
    });
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
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        return (
          error.response?.data ||
          new ResponseModel("BACK-ERROR").withError(500, "Network error")
        );
      }
      return new ResponseModel("APP-ERROR").withError(500, "Unexpected error");
    });
};

export const watchMicroserviceLogs = (): WebSocket => {
  return new WebSocket(AppConfig.ADMIN_WS_URL);
};

export const triggerMicroServicesCheck = (
  serviceName?: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/v1/micro-services/check", { serviceName })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        return (
          error.response?.data ||
          new ResponseModel("BACK-ERROR").withError(500, "Network error")
        );
      }
      return new ResponseModel("APP-ERROR").withError(500, "Unexpected error");
    });
};
