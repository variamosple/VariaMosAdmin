import type { ResponseModel } from "@variamosple/variamos-components";
import * as z from "zod/mini";
import { parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

/** What the signed-in account chose for its display (EV-115 lot C). */
export interface UserPreferences {
  /** An IANA time zone, or null: the browser's then. */
  timeZone: string | null;
}

const preferencesSchema: z.ZodMiniType<UserPreferences> = z.looseObject({
  timeZone: z.nullable(z.string()),
});

const PREFERENCES_ROUTE = "/auth/my-account/preferences";

export const getMyPreferences = (): Promise<ResponseModel<UserPreferences>> => {
  const failure = "Your preferences could not be loaded.";
  return ADMIN_CLIENT.get(PREFERENCES_ROUTE)
    .then((response) =>
      parseResponse(preferencesSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};

/** Null goes back to the time zone of the browser. */
export const updateMyTimeZone = (
  timeZone: string | null,
): Promise<ResponseModel<UserPreferences>> => {
  const failure = "The time zone could not be saved.";
  return ADMIN_CLIENT.put(PREFERENCES_ROUTE, { timeZone })
    .then((response) =>
      parseResponse(preferencesSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};
