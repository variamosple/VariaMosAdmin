import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ROUTES } from "./router";

// Mock SecurityWrapper and Layouts
vi.mock("@/shared/components/SecurityWrapper", async () => ({
  SecurityWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/shared/layouts/MainLayout", async () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/shared/layouts/SignInLayout", async () => ({
  SignInLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock Pages
vi.mock("@/features/auth", async () => ({
  ForgotPasswordPage: () => <div>ForgotPasswordPage</div>,
  LoginPage: () => <div>LoginPage</div>,
  MfaInvitationBanner: () => null,
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
vi.mock("@/features/activity-journal", async () => ({
  JournalPage: () => <div>JournalPage</div>,
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
    expect(paths).toContain("journal");

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

  const renderAt = (path: string) => {
    const route = ROUTES.find((r) => r.path === path);
    const router = createMemoryRouter(
      [
        { path: "*", element: route?.element },
        { path: "/", element: <div>HomePage</div> },
      ],
      { initialEntries: [path === "*" ? "/no-such-page" : path] },
    );
    render(<RouterProvider router={router} />);
  };

  it("answers an unknown address with a not found page (UX-25)", () => {
    renderAt("*");

    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("/no-such-page")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the home page" }),
    ).toHaveAttribute("href", "/");
  });

  it("still sends the former /variamos_admin address home", () => {
    const route = ROUTES.find((r) => r.path === "/variamos_admin");
    const router = createMemoryRouter(
      [
        { path: "/variamos_admin", element: route?.element },
        { path: "/", element: <div>HomePage</div> },
      ],
      { initialEntries: ["/variamos_admin"] },
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByText("HomePage")).toBeInTheDocument();
  });
});
