import {
  AuthWrapper,
  NotAuthorized,
  ProtectedRoute,
} from "@variamosple/variamos-components";
import { type ComponentType, lazy, Suspense } from "react";
import { Spinner } from "react-bootstrap";
import { Navigate, Outlet, type RouteObject } from "react-router-dom";
import {
  ForgotPasswordPage,
  LoginPage,
  MfaInvitationBanner,
  MyAccountPage,
  ResetPasswordPage,
  SignUpPage,
} from "@/features/auth";
import { NotFound } from "@/shared/components/NotFound";
import { SecurityWrapper } from "@/shared/components/SecurityWrapper";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { MainLayout } from "@/shared/layouts/MainLayout";
import { SignInLayout } from "@/shared/layouts/SignInLayout";

// Each page behind the sign-in loads on its first visit, in its own file, so
// the sign-in page does not download them all (T-30). The sign-in pages stay
// in the first file: the application already imports their feature.
const lazyPage = <M,>(
  load: () => Promise<M>,
  pick: (module: M) => ComponentType,
) => lazy(() => load().then((module) => ({ default: pick(module) })));

const JournalPage = lazyPage(
  () => import("@/features/activity-journal"),
  (m) => m.JournalPage,
);
const BugListPage = lazyPage(
  () => import("@/features/bug-tracker"),
  (m) => m.BugListPage,
);
const ConfigurationListPage = lazyPage(
  () => import("@/features/global-configuration"),
  (m) => m.ConfigurationListPage,
);
const HomePage = lazyPage(
  () => import("@/features/home"),
  (m) => m.HomePage,
);
const LanguageListPage = lazyPage(
  () => import("@/features/language-management"),
  (m) => m.LanguageListPage,
);
const MetricsPage = lazyPage(
  () => import("@/features/metrics-dashboard"),
  (m) => m.MetricsPage,
);
const MicroServiceListPage = lazyPage(
  () => import("@/features/microservices"),
  (m) => m.MicroServiceListPage,
);
const ModelListPage = lazyPage(
  () => import("@/features/model-management"),
  (m) => m.ModelListPage,
);
const NotificationsAdminPage = lazyPage(
  () => import("@/features/notifications-admin"),
  (m) => m.NotificationsAdminPage,
);
const PermissionListPage = lazyPage(
  () => import("@/features/permission-management"),
  (m) => m.PermissionListPage,
);
const ProjectListPage = lazyPage(
  () => import("@/features/project-management"),
  (m) => m.ProjectListPage,
);
const RoleListPage = lazyPage(
  () => import("@/features/role-management"),
  (m) => m.RoleListPage,
);
const RoleDetailsPage = lazyPage(
  () => import("@/features/role-management"),
  (m) => m.RoleDetailsPage,
);
const UserListPage = lazyPage(
  () => import("@/features/user-management"),
  (m) => m.UserListPage,
);
const UserDetailsPage = lazyPage(
  () => import("@/features/user-management"),
  (m) => m.UserDetailsPage,
);

const PageLoading = () => (
  <div className="d-flex justify-content-center py-5">
    <Spinner animation="border" variant="primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  </div>
);

const NOT_AUTHORIZED_PATH = "/403";

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    element: (
      <SecurityWrapper>
        <AuthWrapper redirectPath={AppConfig.LOGIN_URL}>
          <MainLayout>
            <MfaInvitationBanner />
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
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
      {
        path: "configurations",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                notAuthorizedPath={NOT_AUTHORIZED_PATH}
                allowedPermissions={["configurations::query"]}
              >
                <ConfigurationListPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "journal",
        element: (
          <ProtectedRoute
            notAuthorizedPath={NOT_AUTHORIZED_PATH}
            allowedPermissions={["activity-logs::query"]}
          >
            <JournalPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/notifications",
        element: (
          <ProtectedRoute
            notAuthorizedPath={NOT_AUTHORIZED_PATH}
            allowedPermissions={["admin::notifications::dispatch"]}
          >
            <NotificationsAdminPage />
          </ProtectedRoute>
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
  // Former address of the application, kept for old links and bookmarks
  {
    path: "/variamos_admin",
    element: <Navigate to="/" replace />,
  },
  {
    path: "*",
    element: (
      <MainLayout>
        <NotFound />
      </MainLayout>
    ),
  },
];
