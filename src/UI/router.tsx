import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "./Layouts/MainLayout";
import { HomePage } from "./Pages/Home";
import { PermissionListPage } from "./Pages/PermissionList";
import { RoleListPage } from "./Pages/RoleList";
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
    path: "/roles",
    Component: MainLayout,
    children: [{ index: true, Component: RoleListPage }],
  },
  {
    path: "/permissions",
    Component: MainLayout,
    children: [{ index: true, Component: PermissionListPage }],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
