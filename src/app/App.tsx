import {
  AnalyticsProvider,
  NotificationProvider,
  SessionProvider,
} from "@variamosple/variamos-components";
import { useEffect, useState } from "react";
import {
  createHashRouter,
  Outlet,
  type RouteObject,
  RouterProvider,
} from "react-router-dom";
import "./App.css";
import {
  getSessionInfo,
  requestLogout,
  requestSignIn,
  requestSignInAsGuest,
  requestSignInMfa,
  requestSignUp,
} from "@/features/auth";
import { registerVisit } from "@/features/metrics-dashboard/api/VisitsRepository";
import { RouterContextProvider } from "@/shared/context/RouterContext";
import { ToastProvider } from "@/shared/context/ToastContext";
import { loadSiteName } from "@/shared/hooks/useSiteName";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { ROUTES } from "./router";

// A data router, so that leaving a page with unsaved input can be asked
// (useBlocker). The routes are under one that gives the router to the
// components of the library.
const APP_ROUTES: RouteObject[] = [
  {
    element: (
      <RouterContextProvider>
        <Outlet />
      </RouterContextProvider>
    ),
    children: ROUTES,
  },
];

function App() {
  const [router] = useState(() => createHashRouter(APP_ROUTES));
  useEffect(() => {
    void loadSiteName();
  }, []);

  return (
    <ToastProvider>
      <AnalyticsProvider onVisit={registerVisit} />
      <SessionProvider
        loginUrl={AppConfig.LOGIN_URL}
        getSessionInfo={getSessionInfo}
        requestSignUp={requestSignUp}
        requestSignIn={requestSignIn}
        requestSignInAsGuest={requestSignInAsGuest}
        requestSignInMfa={requestSignInMfa}
        requestLogout={requestLogout}
      >
        <NotificationProvider
          apiUrl={AppConfig.NOTIFICATION_API_URL}
          adminApiUrl={AppConfig.ADMIN_API_URL}
        >
          <RouterProvider router={router} />
        </NotificationProvider>
      </SessionProvider>
    </ToastProvider>
  );
}

export default App;
