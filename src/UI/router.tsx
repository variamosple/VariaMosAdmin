import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthWrapper from "./Components/AuthWrapper";
import { SecurityWrapper } from "./Components/SecurityWrapper";
import { MainLayout } from "./Layouts/MainLayout";
import { SignInLayout } from "./Layouts/SignInLayout";
import { HomePage } from "./Pages/Home";
import { LoginPage } from "./Pages/LoginPage";
import { MicroServiceListPage } from "./Pages/MicroServiceList";
import { MyAccountPage } from "./Pages/MyAccountPage";
import { PermissionListPage } from "./Pages/PermissionList";
import { RoleDetailsPage } from "./Pages/RoleDetails";
import { RoleListPage } from "./Pages/RoleList";
import { SignUpPage } from "./Pages/SignUpPage";
import { UserDetailsPage } from "./Pages/UserDetails";
import { UserListPage } from "./Pages/UserList";

export const ROUTER = createBrowserRouter(
  [
    {
      path: "/",
      Component: SecurityWrapper,
      children: [
        {
          path: "",
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
          path: "my-account",
          Component: MainLayout,
          children: [
            {
              index: true,
              element: (
                <AuthWrapper>
                  <MyAccountPage />
                </AuthWrapper>
              ),
            },
          ],
        },
        {
          path: "users",
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
            {
              path: ":userId",
              children: [
                {
                  index: true,
                  element: (
                    <AuthWrapper>
                      <UserDetailsPage />
                    </AuthWrapper>
                  ),
                },
              ],
            },
          ],
        },
        {
          path: "roles",
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
              path: ":roleId",
              children: [
                {
                  index: true,
                  element: (
                    <AuthWrapper>
                      <RoleDetailsPage />
                    </AuthWrapper>
                  ),
                },
              ],
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
          ],
        },
        {
          path: "monitoring",
          Component: MainLayout,
          children: [
            {
              index: true,
              element: (
                <AuthWrapper>
                  <MicroServiceListPage />
                </AuthWrapper>
              ),
            },
          ],
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
  ],
  {}
);
