import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { Metric } from "../domain/Entity/Metric";
import type { MetricsFilter } from "../domain/Entity/MetricsFilter";

export const queryMetrics = (): Promise<ResponseModel<Metric[]>> => {
  return ADMIN_CLIENT.get(`/v1/metrics`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query metrics, please try again later.",
      ),
    );
};

export const queryMetric = (
  filter: MetricsFilter,
): Promise<ResponseModel<Metric>> => {
  return ADMIN_CLIENT.get(`/v1/metrics/${filter.id}`, { params: filter })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query metric data, please try again later.",
      ),
    );
};
