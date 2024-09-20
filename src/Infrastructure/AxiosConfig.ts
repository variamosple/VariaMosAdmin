import axios from "axios";

export const ADMIN_CLIENT = axios.create({
  baseURL: "http://localhost:4000",
  timeout: 10000,
  withCredentials: true,
});
