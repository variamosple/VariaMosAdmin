import { useSession } from "@variamosple/variamos-components";
import { type FC, useEffect } from "react";
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
 * checked, and only the answer of the admin decides whether the page goes
 * to the sign-in page; a page with unsaved input is never left (TRV-65).
 */
export const SecurityWrapper: FC<SecurityWrapperProps> = ({ children }) => {
  const { checkSession } = useSession();

  useEffect(() => {
    const watched = [ADMIN_CLIENT, PROJECTS_CLIENT, LANGUAGES_CLIENT].map(
      (client) =>
        [client, setupAxiosInterceptors(client, checkSession)] as const,
    );

    return () => {
      for (const [client, interceptorId] of watched) {
        client.interceptors.response.eject(interceptorId);
      }
    };
  }, [checkSession]);

  return <>{children}</>;
};
