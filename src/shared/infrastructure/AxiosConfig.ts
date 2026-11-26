import { hasUnsavedInput } from "@variamosple/variamos-components";
import axios, { type AxiosError, type AxiosInstance } from "axios";
import type { NavigateFunction } from "react-router-dom";
import { AppConfig } from "./AppConfig";

// The session travels in the httpOnly cookie of the admin service, sent by
// withCredentials: no token is read from the browser storage (EV-117)
export const ADMIN_CLIENT = axios.create({
  baseURL: AppConfig.ADMIN_API_URL,
  timeout: 30000,
  withCredentials: true,
});

export const LANGUAGES_CLIENT = axios.create({
  baseURL: AppConfig.LANGUAGES_API_URL,
  timeout: 30000,
  withCredentials: true,
});

export const PROJECTS_CLIENT = axios.create({
  baseURL: AppConfig.PROJECTS_API_URL,
  timeout: 30000,
  withCredentials: true,
});

// Pages a signed-out visitor may stay on: a 401 there sends nowhere
const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/sign-up",
]);

// The path of the hash route, without its query: "#/login?x=1" gives "/login"
const currentRoutePath = () => {
  const [path = ""] = window.location.hash.replace(/^#/, "").split("?");
  return path;
};

// The check of the session itself: its answer is read by the session
// watcher, and checking again on its 401 would loop
const isSessionCheck = (error: AxiosError) =>
  error.config?.url?.endsWith("/auth/session-info") === true;

/**
 * What a 401 of a service does on a private page. The session is checked at
 * once: the admin renews an expired token, or says that the session is over,
 * and the page keeps its unsaved input either way (TRV-65). Only a page that
 * holds no input is sent to the sign-in page at once, given `navigate` (the
 * admin service); the other services leave it to the check.
 */
export const setupAxiosInterceptors = (
  axiosInstance: AxiosInstance,
  navigate: NavigateFunction | null,
  checkSession: () => void = () => undefined,
) => {
  const interceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (
        error?.response?.status === 401 &&
        !PUBLIC_PATHS.has(currentRoutePath()) &&
        !isSessionCheck(error)
      ) {
        if (navigate && !hasUnsavedInput()) {
          // A code, never the server text: the login page shows its own.
          // The current page is given back after sign-in (UX-27).
          const redirectTo = encodeURIComponent(window.location.href);
          void navigate(
            `/login?reason=session-expired&redirectTo=${redirectTo}`,
          );
        } else {
          checkSession();
        }
      }

      return Promise.reject(error);
    },
  );

  return interceptorId;
};
