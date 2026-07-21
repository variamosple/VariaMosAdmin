import React from "react";
import { ROUTES } from "./router";

// Mock @variamosple/variamos-components
jest.mock("@variamosple/variamos-components", () => ({
  AuthWrapper: ({ children }: any) => <div>{children}</div>,
  NotAuthorized: () => <div>Not Authorized</div>,
  ProtectedRoute: ({ children }: any) => <div>{children}</div>,
}));

// Mock SecurityWrapper and Layouts
jest.mock("@/shared/components/SecurityWrapper", () => ({
  SecurityWrapper: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@/shared/layouts/MainLayout", () => ({
  MainLayout: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@/shared/layouts/SignInLayout", () => ({
  SignInLayout: ({ children }: any) => <div>{children}</div>,
}));

// Mock Pages
jest.mock("@/features/auth", () => ({
  ForgotPasswordPage: () => <div>ForgotPasswordPage</div>,
  LoginPage: () => <div>LoginPage</div>,
  MyAccountPage: () => <div>MyAccountPage</div>,
  ResetPasswordPage: () => <div>ResetPasswordPage</div>,
  SignUpPage: () => <div>SignUpPage</div>,
}));
jest.mock("@/features/home", () => ({
  HomePage: () => <div>HomePage</div>,
}));
jest.mock("@/features/language-management", () => ({
  LanguageListPage: () => <div>LanguageListPage</div>,
}));
jest.mock("@/features/metrics-dashboard", () => ({
  MetricsPage: () => <div>MetricsPage</div>,
}));
jest.mock("@/features/microservices", () => ({
  MicroServiceListPage: () => <div>MicroServiceListPage</div>,
}));
jest.mock("@/features/model-management", () => ({
  ModelListPage: () => <div>ModelListPage</div>,
}));
jest.mock("@/features/permission-management", () => ({
  PermissionListPage: () => <div>PermissionListPage</div>,
}));
jest.mock("@/features/project-management", () => ({
  ProjectListPage: () => <div>ProjectListPage</div>,
}));
jest.mock("@/features/role-management", () => ({
  RoleDetailsPage: () => <div>RoleDetailsPage</div>,
  RoleListPage: () => <div>RoleListPage</div>,
}));
jest.mock("@/features/user-management", () => ({
  UserDetailsPage: () => <div>UserDetailsPage</div>,
  UserListPage: () => <div>UserListPage</div>,
}));
jest.mock("@/features/bug-tracker", () => ({
  BugListPage: () => <div>BugListPage</div>,
}));

describe("Router Configuration", () => {
  it("defines expected main routes and children paths", () => {
    // Assert structure of ROUTES configuration array
    expect(ROUTES).toBeInstanceOf(Array);

    // Check main layout route
    const mainRoute = ROUTES.find((r) => r.path === "/");
    expect(mainRoute).toBeTruthy();
    expect(mainRoute?.children).toBeInstanceOf(Array);

    // Verify some children inside main layout
    const paths = mainRoute?.children?.map((c) => c.path);
    expect(paths).toContain("");
    expect(paths).toContain("my-account");
    expect(paths).toContain("users");
    expect(paths).toContain("roles");
    expect(paths).toContain("projects");
    expect(paths).toContain("models");
    expect(paths).toContain("metrics");
    expect(paths).toContain("bugs");

    // Check auth layouts paths
    const loginRoute = ROUTES.find((r) => r.path === "/login");
    expect(loginRoute).toBeTruthy();

    const signUpRoute = ROUTES.find((r) => r.path === "/sign-up");
    expect(signUpRoute).toBeTruthy();

    const forgotPasswordRoute = ROUTES.find((r) => r.path === "/forgot-password");
    expect(forgotPasswordRoute).toBeTruthy();

    const resetPasswordRoute = ROUTES.find((r) => r.path === "/reset-password");
    expect(resetPasswordRoute).toBeTruthy();

    const forbiddenRoute = ROUTES.find((r) => r.path === "/403");
    expect(forbiddenRoute).toBeTruthy();

    const wildcardRoute = ROUTES.find((r) => r.path === "*");
    expect(wildcardRoute).toBeTruthy();
  });
});
