import {
  ADMIN_CLIENT,
  setupAxiosInterceptors,
} from "@/Infrastructure/AxiosConfig";
import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export interface SecurityWrapperProps {
  children?: React.ReactNode;
}

export const SecurityWrapper: FC<SecurityWrapperProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptorId = setupAxiosInterceptors(ADMIN_CLIENT, navigate);

    return () => {
      ADMIN_CLIENT.interceptors.response.eject(interceptorId);
    };
  }, [navigate]);

  return <>{children}</>;
};
