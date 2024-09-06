import axios from "axios";

export const ADMIN_CLIENT = axios.create({
  baseURL: "http://localhost:3500",
  timeout: 10000,
});
