import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { ConfigurationValue } from "../domain/Entity/Configuration";
import type { ScheduledChange } from "../domain/Entity/ScheduledChange";

const ROUTE = "/v1/configurations/scheduled-changes";

export const queryScheduledChanges = (): Promise<
  ResponseModel<ScheduledChange[]>
> =>
  ADMIN_CLIENT.get(ROUTE)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(error, "The planned changes could not be loaded."),
    );

export const scheduleChange = (
  key: string,
  value: ConfigurationValue,
  dueAt: string,
): Promise<ResponseModel<ScheduledChange>> =>
  ADMIN_CLIENT.post(ROUTE, { key, value, dueAt })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(error, "The change could not be planned."),
    );

export const rescheduleChange = (
  id: number,
  value: ConfigurationValue,
  dueAt: string,
): Promise<ResponseModel<ScheduledChange>> =>
  ADMIN_CLIENT.put(`${ROUTE}/${id}`, { value, dueAt })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(error, "The planned change could not be saved."),
    );

export const cancelScheduledChange = (
  id: number,
): Promise<ResponseModel<ScheduledChange>> =>
  ADMIN_CLIENT.post(`${ROUTE}/${id}/cancel`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(error, "The planned change could not be cancelled."),
    );
