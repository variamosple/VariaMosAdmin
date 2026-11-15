import type { ResponseModel } from "@variamosple/variamos-components";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { LANGUAGES_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import type { Language } from "../domain/Entity/Language";
import type { LanguagesFilter } from "../domain/Entity/LanguageFilter";
import { languageSchema, languagesSchema } from "./languageSchemas";

export const queryLanguages = (
  filter: LanguagesFilter,
): Promise<ResponseModel<Language[]>> => {
  const failure =
    "Error when trying to query language, please try again later.";
  return LANGUAGES_CLIENT.get("/v1/admin/languages", { params: filter })
    .then((response) => parseResponse(languagesSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const deleteLanguage = (
  languageId: number,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to delete the language, please try again later.";
  return LANGUAGES_CLIENT.delete(`/v1/admin/languages/${languageId}`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const updateLanguage = (
  request: Partial<Language>,
): Promise<ResponseModel<Language>> => {
  const failure = `Error when trying to update the language with id: ${request.id}, please try again later.`;
  return LANGUAGES_CLIENT.put(`/v1/admin/languages/${request.id}`, request)
    .then((response) => parseResponse(languageSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
