import { RouterProvider } from "react-router-dom";
import "./App.css";
import { SessionProvider } from "./UI/Context/SessionsContext";
import { ROUTER } from "./UI/router";

function App() {
  return (
    <SessionProvider>
      <RouterProvider router={ROUTER} />
    </SessionProvider>
  );
}

export default App;
