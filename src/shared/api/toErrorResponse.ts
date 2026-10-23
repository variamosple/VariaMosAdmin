import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
import {
  errorMessageOf,
  SYSTEM_ERROR_MESSAGE,
  UNREACHABLE_MESSAGE,
} from "./errorMessages";

/** Error code when no response came back: network down or timeout. */
export const UNREACHABLE_ERROR_CODE = 503;

// Statuses a proxy answers when the service behind it is down
const PROXY_STATUSES = new Set([502, 503, 504]);

interface ErrorBody {
  errorCode?: number | string;
  message?: string;
}

// A body the server wrote on purpose, unlike an HTML page from the proxy
const isErrorBody = (
  data: object | string | null | undefined,
): data is ErrorBody =>
  typeof data === "object" &&
  data !== null &&
  !Array.isArray(data) &&
  ("errorCode" in data || "message" in data);

/**
 * The ResponseModel for a failed request. Its errorCode is always set, so a
 * failure can never be read as a success, and its message comes from the
 * message table (T-16).
 */
export const toErrorResponse = <T = Record<string, never>>(
  error: Error | object | null | undefined,
  fallbackMessage: string,
): ResponseModel<T> => {
  if (!axios.isAxiosError(error)) {
    console.error("Unexpected error:", error);
    return new ResponseModel<T>("APP-ERROR").withError(500, fallbackMessage);
  }

  console.error("Axios error:", error.message);
  const status = error.response?.status;
  const data = error.response?.data;

  if (status && isErrorBody(data)) {
    const response = Object.assign(new ResponseModel<T>(), data);
    if (!response.errorCode) response.errorCode = status;
    response.message = errorMessageOf(status, data.errorCode, data.message);
    return response;
  }

  return new ResponseModel<T>("BACK-ERROR").withError(
    status ?? UNREACHABLE_ERROR_CODE,
    !status || PROXY_STATUSES.has(status)
      ? UNREACHABLE_MESSAGE
      : SYSTEM_ERROR_MESSAGE,
  );
};
