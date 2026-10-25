import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { NavigateFunction } from "react-router-dom";
import { AppConfig } from "./AppConfig";

const authInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

export const ADMIN_CLIENT = axios.create({
  baseURL: AppConfig.ADMIN_API_URL,
  timeout: 30000,
  withCredentials: true,
});

ADMIN_CLIENT.interceptors.request.use(authInterceptor);

export const LANGUAGES_CLIENT = axios.create({
  baseURL: AppConfig.LANGUAGES_API_URL,
  timeout: 30000,
  withCredentials: true,
});

LANGUAGES_CLIENT.interceptors.request.use(authInterceptor);

export const PROJECTS_CLIENT = axios.create({
  baseURL: AppConfig.PROJECTS_API_URL,
  timeout: 30000,
  withCredentials: true,
});

PROJECTS_CLIENT.interceptors.request.use(authInterceptor);

// Pages a signed-out visitor may stay on: a 401 there sends nowhere
const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/sign-up",
]);

// The path of the hash route, without its query: "#/login?x=1" gives "/login"
const currentRoutePath = () =>
  window.location.hash.replace(/^#/, "").split("?")[0];

export const setupAxiosInterceptors = (
  axiosInstance: AxiosInstance,
  navigate: NavigateFunction,
) => {
  const interceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (
        error?.response?.status === 401 &&
        !PUBLIC_PATHS.has(currentRoutePath())
      ) {
        // A code, never the server text: the login page shows its own. The
        // current page is given back after sign-in (UX-27).
        const redirectTo = encodeURIComponent(window.location.href);
        navigate(`/login?reason=session-expired&redirectTo=${redirectTo}`);
      }

      return Promise.reject(error);
    },
  );

  return interceptorId;
};
