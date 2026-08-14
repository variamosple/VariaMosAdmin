import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";

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

    if (response) {
      return Object.assign(new ResponseModel(), response);
    }

    return new ResponseModel("BACK-ERROR").withError(
      Number.parseInt(error.code || "500", 10),
      "Error when communicating with the back-end.",
    );
  } else {
    console.error("Unexpected error:", error);

    return new ResponseModel("APP-ERROR").withError(500, fallbackMessage);
  }
};
