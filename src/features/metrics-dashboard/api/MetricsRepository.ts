import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { ChartPeriod } from "../domain/Entity/ChartPeriod";
import type { Metric } from "../domain/Entity/Metric";

/** Every chart of the page, over one period. */
export const queryMetrics = (
  period: ChartPeriod,
): Promise<ResponseModel<Metric[]>> => {
  return ADMIN_CLIENT.get("/v1/metrics", {
    params: { startDate: period.fromDate, endDate: period.toDate },
  })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query metrics, please try again later.",
      ),
    );
};
