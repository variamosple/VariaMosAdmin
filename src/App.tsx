import { FC } from "react";
import { HashRouter, useRoutes } from "react-router-dom";
import "./App.css";
import { VariamosAnalitycsComponent } from "./UI/Components/VariamosAnalitycs";
import { SessionProvider } from "./UI/Context/SessionsContext";
import { ToastProvider } from "./UI/Context/ToastContext";
import { ROUTES } from "./UI/router";

const Routes: FC = () => {
  return useRoutes(ROUTES);
};

function App() {
  return (
    <ToastProvider>
      <SessionProvider>
        <HashRouter>
          <VariamosAnalitycsComponent routes={ROUTES} />
          <Routes />
        </HashRouter>
      </SessionProvider>
    </ToastProvider>
  );
}

export default App;
