import {
  AnalyticsProvider,
  SessionProvider,
} from "@variamosple/variamos-components";
import { FC } from "react";
import { HashRouter, useRoutes } from "react-router-dom";
import "./App.css";
import {
  getSessionInfo,
  requestLogout,
  requestSignIn,
  requestSignInAsGuest,
  requestSignUp,
} from "./DataProviders/AuthRepository";
import { registerVisit } from "./DataProviders/VisitsRepository";
import { AppConfig } from "./Infrastructure/AppConfig";
import { RouterProvider } from "./UI/Context/RouterContext";
import { ToastProvider } from "./UI/Context/ToastContext";
import { ROUTES } from "./UI/router";

const Routes: FC = () => {
  return useRoutes(ROUTES);
};

function App() {
  return (
    <ToastProvider>
      <AnalyticsProvider onVisit={registerVisit} />
      <SessionProvider
        loginUrl={AppConfig.LOGIN_URL}
        getSessionInfo={getSessionInfo}
        requestSignUp={requestSignUp}
        requestSignIn={requestSignIn}
        requestSignInAsGuest={requestSignInAsGuest}
        requestLogout={requestLogout}
      >
        <HashRouter>
          <RouterProvider>
            <Routes />
          </RouterProvider>
        </HashRouter>
      </SessionProvider>
    </ToastProvider>
  );
}

export default App;
