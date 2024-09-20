import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthWrapper from "./Components/AuthWrapper";
import { MainLayout } from "./Layouts/MainLayout";
import { SignInLayout } from "./Layouts/SignInLayout";
import { HomePage } from "./Pages/Home";
import { LoginPage } from "./Pages/LoginPage";
import { PermissionCreatePage } from "./Pages/PermissionCreate";
import { PermissionListPage } from "./Pages/PermissionList";
import { RoleCreatePage } from "./Pages/RoleCreate";
import { RoleListPage } from "./Pages/RoleList";
import { SignUpPage } from "./Pages/SignUpPage";
import { UserListPage } from "./Pages/UserList";

export const ROUTER = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      {
        index: true,
        element: (
          <AuthWrapper>
            <HomePage />
          </AuthWrapper>
        ),
      },
    ],
  },
  {
    path: "/users",
    Component: MainLayout,
    children: [
      {
        index: true,
        element: (
          <AuthWrapper>
            <UserListPage />
          </AuthWrapper>
        ),
      },
    ],
  },
  {
    path: "/roles",
    Component: MainLayout,
    children: [
      {
        index: true,
        element: (
          <AuthWrapper>
            <RoleListPage />
          </AuthWrapper>
        ),
      },
      {
        path: "create",
        element: (
          <AuthWrapper>
            <RoleCreatePage />
          </AuthWrapper>
        ),
      },
    ],
  },
  {
    path: "permissions",
    Component: MainLayout,
    children: [
      {
        index: true,
        element: (
          <AuthWrapper>
            <PermissionListPage />
          </AuthWrapper>
        ),
      },
      {
        path: "create",
        element: (
          <AuthWrapper>
            <PermissionCreatePage />
          </AuthWrapper>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <SignInLayout>
        <LoginPage />
      </SignInLayout>
    ),
  },
  {
    path: "/sign-up",
    element: (
      <SignInLayout>
        <SignUpPage />
      </SignInLayout>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
