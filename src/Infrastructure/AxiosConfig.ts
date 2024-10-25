import axios, { AxiosInstance } from "axios";
import { NavigateFunction } from "react-router-dom";

export const ADMIN_CLIENT = axios.create({
  baseURL: "http://localhost:4000",
  timeout: 10000,
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
        navigate("/login");
      }

      return Promise.reject(error);
    }
  );

  return interceptorId;
};
