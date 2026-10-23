import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type {
  AccessEntry,
  AccessFilter,
  ActivityEntry,
  ActivityFilter,
} from "../domain/JournalEntry";

// Empty fields are left out: the server reads them as "no filter"
const paramsOf = (filter: object) =>
  Object.fromEntries(
    Object.entries(filter).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

export const queryActivityLogs = (
  filter: ActivityFilter,
): Promise<ResponseModel<ActivityEntry[]>> =>
  ADMIN_CLIENT.get("/v1/activity-logs", { params: paramsOf(filter) })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to read the activity journal, please try again later.",
      ),
    );

export const queryAccessLogs = (
  filter: AccessFilter,
): Promise<ResponseModel<AccessEntry[]>> =>
  ADMIN_CLIENT.get("/v1/access-logs", { params: paramsOf(filter) })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to read the access journal, please try again later.",
      ),
    );
