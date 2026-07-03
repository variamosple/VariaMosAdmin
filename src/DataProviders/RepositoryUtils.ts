import axios from "axios";
import { ResponseModel } from "@variamosple/variamos-components";

/**
 * Centrally processes Axios and other network errors, mapping them to a standardized ResponseModel.
 */
export const handleRepositoryError = (
  error: unknown,
  fallbackMessage: string,
): ResponseModel<any> => {
  if (axios.isAxiosError(error)) {
    console.error("Axios error:", error.message);

    const response = error.response?.data;

    if (!!response) {
      return response;
    }

    return new ResponseModel("BACK-ERROR").withError(
      Number.parseInt(error.code || "500"),
      "Error when communicating with the back-end.",
    );
  } else {
    console.error("Unexpected error:", error);

    return new ResponseModel("APP-ERROR").withError(500, fallbackMessage);
  }
};
