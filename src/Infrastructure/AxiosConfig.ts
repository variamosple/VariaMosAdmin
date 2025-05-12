import axios, { AxiosInstance } from "axios";
import { NavigateFunction } from "react-router-dom";
import { AppConfig } from "./AppConfig";

import { InternalAxiosRequestConfig } from "axios";

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

export const setupAxiosInterceptors = (
  axiosInstance: AxiosInstance,
  navigate: NavigateFunction
) => {
  const interceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error?.response?.status === 401) {
        navigate(`/login?errorMessage=${error.response?.data?.message || ""}`);
      }

      return Promise.reject(error);
    }
  );

  return interceptorId;
};
