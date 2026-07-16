import { Navigate, Outlet, RouteObject } from "react-router-dom";

import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { AuthWrapper, NotAuthorized, ProtectedRoute } from "@variamosple/variamos-components";
import { SecurityWrapper } from "@/UI/Components/SecurityWrapper";
import { MainLayout } from "@/UI/Layouts/MainLayout";
import { SignInLayout } from "@/UI/Layouts/SignInLayout";
import { ForgotPasswordPage, LoginPage, MyAccountPage, ResetPasswordPage } from "@/features/auth";
import { HomePage } from "@/UI/Pages/Home";
import { LanguageListPage } from "@/UI/Pages/LanguageListPage";
import { MetricsPage } from "@/UI/Pages/Metrics";
import { MicroServiceListPage } from "@/UI/Pages/MicroServiceList";
import { ModelListPage } from "@/UI/Pages/ModelListPage";
import { PermissionListPage } from "@/features/permission-management";
import { ProjectListPage } from "@/features/project-management";
import { RoleDetailsPage, RoleListPage } from "@/features/role-management";
import { SignUpPage } from "@/UI/Pages/SignUpPage";
import { UserDetailsPage, UserListPage } from "@/features/user-management";

import { BugListPage } from "@/features/bug-tracker";

const NOT_AUTHORIZED_PATH = "/403";

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    element: (
      <SecurityWrapper>
        <AuthWrapper redirectPath={AppConfig.LOGIN_URL}>
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
          <ProtectedRoute notAuthorizedPath={NOT_AUTHORIZED_PATH} allowedPermissions={[]}>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-account",
        element: (
          <ProtectedRoute notAuthorizedPath={NOT_AUTHORIZED_PATH} allowedPermissions={[]}>
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
        path: "languages",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["admin::languages::query"]}
              >
                <LanguageListPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "projects",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["admin::projects::query"]}
              >
                <ProjectListPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "models",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["admin::models::query"]}
              >
                <ModelListPage />
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
      {
        path: "bugs",
        element: (
          <ProtectedRoute
            notAuthorizedPath={NOT_AUTHORIZED_PATH}
            allowedPermissions={["bugs::query"]}
          >
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <BugListPage />,
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
    path: "/forgot-password",
    element: (
      <SignInLayout>
        <ForgotPasswordPage />
      </SignInLayout>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <SignInLayout>
        <ResetPasswordPage />
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
