import { ROUTES } from "./router";

// Mock @variamosple/variamos-components
vi.mock("@variamosple/variamos-components", async () => ({
  AuthWrapper: ({ children }: any) => <div>{children}</div>,
  NotAuthorized: () => <div>Not Authorized</div>,
  ProtectedRoute: ({ children }: any) => <div>{children}</div>,
}));

// Mock SecurityWrapper and Layouts
vi.mock("@/shared/components/SecurityWrapper", async () => ({
  SecurityWrapper: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/shared/layouts/MainLayout", async () => ({
  MainLayout: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/shared/layouts/SignInLayout", async () => ({
  SignInLayout: ({ children }: any) => <div>{children}</div>,
}));

// Mock Pages
vi.mock("@/features/auth", async () => ({
  ForgotPasswordPage: () => <div>ForgotPasswordPage</div>,
  LoginPage: () => <div>LoginPage</div>,
  MyAccountPage: () => <div>MyAccountPage</div>,
  ResetPasswordPage: () => <div>ResetPasswordPage</div>,
  SignUpPage: () => <div>SignUpPage</div>,
}));
vi.mock("@/features/home", async () => ({
  HomePage: () => <div>HomePage</div>,
}));
vi.mock("@/features/language-management", async () => ({
  LanguageListPage: () => <div>LanguageListPage</div>,
}));
vi.mock("@/features/metrics-dashboard", async () => ({
  MetricsPage: () => <div>MetricsPage</div>,
}));
vi.mock("@/features/microservices", async () => ({
  MicroServiceListPage: () => <div>MicroServiceListPage</div>,
}));
vi.mock("@/features/model-management", async () => ({
  ModelListPage: () => <div>ModelListPage</div>,
}));
vi.mock("@/features/permission-management", async () => ({
  PermissionListPage: () => <div>PermissionListPage</div>,
}));
vi.mock("@/features/project-management", async () => ({
  ProjectListPage: () => <div>ProjectListPage</div>,
}));
vi.mock("@/features/role-management", async () => ({
  RoleDetailsPage: () => <div>RoleDetailsPage</div>,
  RoleListPage: () => <div>RoleListPage</div>,
}));
vi.mock("@/features/user-management", async () => ({
  UserDetailsPage: () => <div>UserDetailsPage</div>,
  UserListPage: () => <div>UserListPage</div>,
}));
vi.mock("@/features/bug-tracker", async () => ({
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

    const forgotPasswordRoute = ROUTES.find(
      (r) => r.path === "/forgot-password",
    );
    expect(forgotPasswordRoute).toBeTruthy();

    const resetPasswordRoute = ROUTES.find((r) => r.path === "/reset-password");
    expect(resetPasswordRoute).toBeTruthy();

    const forbiddenRoute = ROUTES.find((r) => r.path === "/403");
    expect(forbiddenRoute).toBeTruthy();

    const wildcardRoute = ROUTES.find((r) => r.path === "*");
    expect(wildcardRoute).toBeTruthy();
  });
});
