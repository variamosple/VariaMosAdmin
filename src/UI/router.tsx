import { Navigate, Outlet, RouteObject } from "react-router-dom";

import {
  AuthWrapper,
  NotAuthorized,
  ProtectedRoute,
} from "variamos-components";
import { SecurityWrapper } from "./Components/SecurityWrapper";
import { MainLayout } from "./Layouts/MainLayout";
import { SignInLayout } from "./Layouts/SignInLayout";
import { HomePage } from "./Pages/Home";
import { LoginPage } from "./Pages/LoginPage";
import { MetricsPage } from "./Pages/Metrics";
import { MicroServiceListPage } from "./Pages/MicroServiceList";
import { MyAccountPage } from "./Pages/MyAccountPage";
import { PermissionListPage } from "./Pages/PermissionList";
import { RoleDetailsPage } from "./Pages/RoleDetails";
import { RoleListPage } from "./Pages/RoleList";
import { SignUpPage } from "./Pages/SignUpPage";
import { UserDetailsPage } from "./Pages/UserDetails";
import { UserListPage } from "./Pages/UserList";

const NOT_AUTHORIZED_PATH = "/403";

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    element: (
      <SecurityWrapper>
        <AuthWrapper redirectPath="http://localhost:8081/variamos_admin/#/login">
          <MainLayout>
            <Outlet />
          </MainLayout>
        </AuthWrapper>
      </SecurityWrapper>
    ),
    children: [
      {
        path: "",
        index: true,
        element: (
          <ProtectedRoute
            notAuthorizedPath={NOT_AUTHORIZED_PATH}
            allowedPermissions={[]}
          >
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-account",
        element: (
          <ProtectedRoute
            notAuthorizedPath={NOT_AUTHORIZED_PATH}
            allowedPermissions={[]}
          >
            <MyAccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute
            notAuthorizedPath={NOT_AUTHORIZED_PATH}
            allowedPermissions={["users::query"]}
          >
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <UserListPage />,
          },
          {
            path: ":userId",
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute
                    notAuthorizedPath={NOT_AUTHORIZED_PATH}
                    allowedPermissions={["users::update"]}
                  >
                    <UserDetailsPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "roles",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["roles::query"]}
              >
                <RoleListPage />
              </ProtectedRoute>
            ),
          },
          {
            path: ":roleId",
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute
                    notAuthorizedPath={NOT_AUTHORIZED_PATH}
                    allowedPermissions={["roles::update"]}
                  >
                    <RoleDetailsPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "permissions",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["permissions::query"]}
              >
                <PermissionListPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "metrics",

        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["metrics::query"]}
              >
                <MetricsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "monitoring",

        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["micro-services::query"]}
              >
                <MicroServiceListPage />
              </ProtectedRoute>
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
    path: "/403",
    element: (
      <MainLayout>
        <NotAuthorized homePath="/" />
      </MainLayout>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
