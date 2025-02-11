import axios, { AxiosInstance } from "axios";
import { NavigateFunction } from "react-router-dom";
import { AppConfig } from "./AppConfig";

export const ADMIN_CLIENT = axios.create({
  baseURL: AppConfig.ADMIN_API_URL,
  timeout: 30000,
  withCredentials: true,
});

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
