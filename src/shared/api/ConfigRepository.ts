import type { Menu, ResponseModel } from "@variamosple/variamos-components";
import * as z from "zod/mini";
import { parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";

export const requestMenuConfig = (): Promise<ResponseModel<Menu>> => {
  return ADMIN_CLIENT.get(`/v1/configurations/menu`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query menu config, please try again later.",
      ),
    );
};

/** What every page may know before signing in (EV-87 lot 2). */
export interface PublicSettings {
  siteName: string;
}

const publicSettingsSchema: z.ZodMiniType<PublicSettings> = z.looseObject({
  // The server refuses a name the tabs cannot show; checked here as well
  siteName: z.string().check(z.minLength(1), z.maxLength(60)),
});

export const requestPublicSettings = (): Promise<
  ResponseModel<PublicSettings>
> => {
  const failure = "Error when trying to read the site name.";
  return ADMIN_CLIENT.get("/v1/configurations/public")
    .then((response) =>
      parseResponse(publicSettingsSchema, response.data, failure),
    )
    .catch((error) => toErrorResponse(error, failure));
};
