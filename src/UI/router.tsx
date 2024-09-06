import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "./Layouts/MainLayout";
import { HomePage } from "./Pages/Home";
import { UserListPage } from "./Pages/UserList";

export const ROUTER = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [{ index: true, Component: HomePage }],
  },
  {
    path: "/users",
    Component: MainLayout,
    children: [{ index: true, Component: UserListPage }],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
