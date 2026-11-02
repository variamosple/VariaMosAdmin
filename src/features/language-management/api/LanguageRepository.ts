import type { ResponseModel } from "@variamosple/variamos-components";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { LANGUAGES_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { Language } from "../domain/Entity/Language";
import type { LanguagesFilter } from "../domain/Entity/LanguageFilter";

export const queryLanguages = (
  filter: LanguagesFilter,
): Promise<ResponseModel<Language[]>> => {
  return LANGUAGES_CLIENT.get("/v1/admin/languages", { params: filter })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query language, please try again later.",
      ),
    );
};

export const deleteLanguage = (
  languageId: number,
): Promise<ResponseModel<void>> => {
  return LANGUAGES_CLIENT.delete(`/v1/admin/languages/${languageId}`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to delete the language, please try again later.",
      ),
    );
};

export const updateLanguage = (
  request: Partial<Language>,
): Promise<ResponseModel<Language>> => {
  return LANGUAGES_CLIENT.put(`/v1/admin/languages/${request.id}`, request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to update the language with id: ${request.id}, please try again later.`,
      ),
    );
};
