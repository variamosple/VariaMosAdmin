import { RouterProvider } from "react-router-dom";
import "./App.css";
import { ROUTER } from "./UI/router";

function App() {
  return <RouterProvider router={ROUTER} />;
}

export default App;
