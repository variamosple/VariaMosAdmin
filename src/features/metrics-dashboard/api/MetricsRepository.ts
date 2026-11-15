import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { ChartPeriod } from "../domain/Entity/ChartPeriod";
import type { Metric } from "../domain/Entity/Metric";

/**
 * Every chart of the page, over one period; the hours of the sign-ins grid
 * in the reader's time zone.
 */
export const queryMetrics = (
  period: ChartPeriod,
  timeZone: string,
): Promise<ResponseModel<Metric[]>> => {
  return ADMIN_CLIENT.get("/v1/metrics", {
    params: { startDate: period.fromDate, endDate: period.toDate, timeZone },
  })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query metrics, please try again later.",
      ),
    );
};
