import axios, { type AxiosError, type AxiosInstance } from "axios";
import { isPublicRoute } from "@/shared/api/routePath";
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

// The check of the session itself: its answer is read by the session
// watcher, and checking again on its 401 would loop
const isSessionCheck = (error: AxiosError) =>
  error.config?.url?.endsWith("/auth/session-info") === true;

/**
 * What a 401 of a service does on a private page: the session is checked at
 * once, and only the answer of the admin decides. A token expired while the
 * admin restarted is renewed and the page goes on; an ended session sends
 * a page without input to the sign-in page, and keeps a page with input
 * (TRV-65). Sending to the sign-in page on the 401 itself refused a session
 * that the admin was about to renew ("Your session has expired" just after
 * a restart).
 */
export const setupAxiosInterceptors = (
  axiosInstance: AxiosInstance,
  checkSession: () => void = () => undefined,
) => {
  const interceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (
        error?.response?.status === 401 &&
        !isPublicRoute() &&
        !isSessionCheck(error)
      ) {
        checkSession();
      }

      return Promise.reject(error);
    },
  );

  return interceptorId;
};
