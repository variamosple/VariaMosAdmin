import {
  ADMIN_CLIENT,
  setupAxiosInterceptors,
} from "@/Infrastructure/AxiosConfig";
import { FC, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export const SecurityWrapper: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptorId = setupAxiosInterceptors(ADMIN_CLIENT, navigate);

    return () => {
      ADMIN_CLIENT.interceptors.response.eject(interceptorId);
    };
  }, [navigate]);

  return <Outlet />;
};
