import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";

import { Language } from "@/Domain/Language/Language";
import { LanguagesFilter } from "@/Domain/Language/LanguageFilter";
import { LANGUAGES_CLIENT } from "@/Infrastructure/AxiosConfig";

export const queryLanguages = (
  filter: LanguagesFilter
): Promise<ResponseModel<Language[]>> => {
  return LANGUAGES_CLIENT.get("/v1/admin/languages", { params: filter })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query language, please try again later.`
        );
      }
    });
};

export const deleteLanguage = (
  languageId: number
): Promise<ResponseModel<void>> => {
  return LANGUAGES_CLIENT.delete(`/v1/admin/languages/${languageId}`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to delete the language, please try again later."
        );
      }
    });
};

export const queryLanguageById = (
  languageId: number
): Promise<ResponseModel<Language>> => {
  return LANGUAGES_CLIENT.get(`/v1/admin/languages/${languageId}`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query the language with id: ${languageId}, please try again later.`
        );
      }
    });
};

export const updateLanguage = (
  request: Partial<Language>
): Promise<ResponseModel<Language>> => {
  return LANGUAGES_CLIENT.put(`/v1/admin/languages/${request.id}`, request)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to update the language with id: ${request.id}, please try again later.`
        );
      }
    });
};
