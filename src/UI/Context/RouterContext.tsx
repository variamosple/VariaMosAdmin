import {
  getBasePath,
  isAbsoluteUrl,
  RouterContext,
  RouterContextProps,
} from "@variamosple/variamos-components";
import { FC, ReactNode, useCallback, useContext, useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

export const RouterProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathname = useMemo(() => getBasePath(), []);

  const navigateTo = useCallback(
    (url: string, options: any) => {
      const basePath = window.location.origin + pathname;
      if (isAbsoluteUrl(url) && !url.startsWith(basePath)) {
        window.open(url, options?.target || "_self");
      } else {
        navigate(url.replace(basePath, "").replace(/^#/, ""), options);
      }
    },
    [navigate, pathname]
  );

  return (
    <RouterContext.Provider
      value={{
        params,
        queryParams: searchParams,
        pathname: location.pathname,
        navigate: navigateTo,
        basePath: pathname,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextProps => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
};
