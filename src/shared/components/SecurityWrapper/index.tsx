import { useSession } from "@variamosple/variamos-components";
import { type FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ADMIN_CLIENT,
  LANGUAGES_CLIENT,
  PROJECTS_CLIENT,
  setupAxiosInterceptors,
} from "@/shared/infrastructure/AxiosConfig";

export interface SecurityWrapperProps {
  children?: React.ReactNode;
}

/**
 * Reads the 401 of every service of the private pages: the session is
 * checked, and a page with unsaved input is never left (TRV-65).
 */
export const SecurityWrapper: FC<SecurityWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const { checkSession } = useSession();

  useEffect(() => {
    const watched = [
      [
        ADMIN_CLIENT,
        setupAxiosInterceptors(ADMIN_CLIENT, navigate, checkSession),
      ],
      [
        PROJECTS_CLIENT,
        setupAxiosInterceptors(PROJECTS_CLIENT, null, checkSession),
      ],
      [
        LANGUAGES_CLIENT,
        setupAxiosInterceptors(LANGUAGES_CLIENT, null, checkSession),
      ],
    ] as const;

    return () => {
      for (const [client, interceptorId] of watched) {
        client.interceptors.response.eject(interceptorId);
      }
    };
  }, [navigate, checkSession]);

  return <>{children}</>;
};
