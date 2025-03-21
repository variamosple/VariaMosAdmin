import "bootstrap/dist/css/bootstrap.min.css";
import React, { lazy, Suspense } from "react";
import { Spinner } from "react-bootstrap";
import ReactDOM from "react-dom/client";

import "./index.css";
import "./Infrastructure/types/global.d.ts";
import reportWebVitals from "./reportWebVitals";

const App = lazy(() => import("./App"));

const Root = () => (
  <Suspense
    fallback={
      <div className="d-flex justify-content-center align-items-center w-100 h-100">
        <Spinner
          animation="border"
          variant="primary"
          style={{ width: "3rem", height: "3rem", borderWidth: "0.5rem" }}
        />
      </div>
    }
  >
    <App />
  </Suspense>
);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
