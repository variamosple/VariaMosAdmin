import {
  Events,
  getBasePath,
  isAbsoluteUrl,
  RouterContext,
} from "@variamosple/variamos-components";
import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
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
    (
      url: string,
      options?: {
        replace?: boolean;
        target?: "_blank" | "_self" | "_parent" | "_top";
      },
    ) => {
      if (url.endsWith("#report-bug")) {
        Events.publish<Record<string, never>>("openReportBugModal", {});
        return;
      }
      const base = pathname.endsWith("/") ? pathname : `${pathname}/`;
      const fullBase = window.location.origin + base;
      if (isAbsoluteUrl(url) && !url.startsWith(fullBase)) {
        window.open(url, options?.target || "_self");
        return;
      }
      // An address of this application, in full or from its base path
      // ("/variamos_admin/#/my-account" from the menu), is a route of the
      // hash router: without its base, it was routed as "/variamos_admin/"
      let route = url;
      if (route.startsWith(fullBase)) {
        route = route.slice(fullBase.length);
      } else if (base !== "/" && route.startsWith(base)) {
        route = route.slice(base.length);
      }
      navigate(route.replace(/^\/?#/, "") || "/", options);
    },
    [navigate, pathname],
  );

  useEffect(() => {
    const eventListener = (event: CustomEvent<string>) => {
      navigateTo(event.detail, {});
    };

    Events.subscribe<string>("variamosNavigate", eventListener);

    return () => Events.unsubscribe("variamosNavigate", eventListener);
  }, [navigateTo]);

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
