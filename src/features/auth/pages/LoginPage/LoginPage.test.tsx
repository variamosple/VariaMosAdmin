import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { useRouter, useSession } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";

import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { LoginPage } from "./index";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

// Mock @variamosple/variamos-components to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => ({
  withPageVisit: (component: any) => component,
  useRouter: vi.fn(),
  useSession: vi.fn(),
  PagedModel: class PagedModel {},
}));

// Mock Subcomponents
vi.mock("../../components/GoogleLogin", async () => ({
  GoogleLogin: () => <div data-testid="mock-google-login">Google Login</div>,
}));

vi.mock("../../components/LoginForm", async () => ({
  LoginForm: ({ onSignIn }: any) => (
    <button
      data-testid="mock-login-form"
      onClick={() => onSignIn({ username: "user", password: "pwd" })}
    >
      Submit Login
    </button>
  ),
}));

describe("LoginPage Page Component", () => {
  const mockNavigate = vi.fn();
  const mockSignIn = vi.fn();
  const mockSignInAsGuest = vi.fn();
  let mockQueryParams: URLSearchParams;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryParams = new URLSearchParams();

    (useRouter as import("vitest").Mock).mockReturnValue({
      queryParams: mockQueryParams,
      navigate: mockNavigate,
    });

    (useSession as import("vitest").Mock).mockReturnValue({
      signIn: mockSignIn,
      signInAsGuest: mockSignInAsGuest,
      isLoading: false,
    });
  });

  const renderLoginPage = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

  it("renders LoginPage components correctly", () => {
    renderLoginPage();
    expect(screen.getByAltText("Variamos logo")).toBeInTheDocument();
    expect(screen.getByTestId("mock-login-form")).toBeInTheDocument();
    expect(screen.getByTestId("mock-google-login")).toBeInTheDocument();
    expect(screen.getByText("Continue as a Guest")).toBeInTheDocument();
    expect(screen.getByText("Sign up here")).toBeInTheDocument();
  });

  it("handles successful sign in and navigates to default home page", async () => {
    mockSignIn.mockResolvedValueOnce({ errorCode: null, data: {} });
    renderLoginPage();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("mock-login-form"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        username: "user",
        password: "pwd",
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith(AppConfig.HOME_PAGE);
  });

  it("handles failed sign in and displays error message", async () => {
    mockSignIn.mockResolvedValueOnce({
      errorCode: 401,
      message: "Invalid credentials",
    });
    renderLoginPage();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("mock-login-form"));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    // Close/dismiss alert
    await user.click(screen.getByLabelText("Close alert"));
    expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
  });

  it("handles successful guest sign in and navigates to redirect target", async () => {
    mockSignInAsGuest.mockResolvedValueOnce({
      errorCode: null,
      data: { redirect: "/dashboard" },
    });
    renderLoginPage();

    const user = userEvent.setup();
    await user.click(screen.getByText("Continue as a Guest"));

    await waitFor(() => {
      expect(mockSignInAsGuest).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("handles guest sign in failure", async () => {
    mockSignInAsGuest.mockResolvedValueOnce({
      errorCode: 500,
      message: "Server error",
    });
    renderLoginPage();

    const user = userEvent.setup();
    await user.click(screen.getByText("Continue as a Guest"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("shows error message if queryParams contains errorMessage", () => {
    mockQueryParams.set("errorMessage", "Session expired");
    renderLoginPage();
    expect(screen.getByText("Session expired")).toBeInTheDocument();
  });

  it("registers redirect if queryParams contains redirectTo", async () => {
    let redirectUrlCalledWith: string | null = null;
    server.use(
      http.post(apiTarget("/auth/redirects"), async ({ request }) => {
        const body = (await request.json()) as any;
        redirectUrlCalledWith = body.url;
        return HttpResponse.json({ errorCode: null });
      }),
    );

    mockQueryParams.set("redirectTo", "%2Fmy-target");
    renderLoginPage();

    await waitFor(() => {
      expect(redirectUrlCalledWith).toBe("/my-target");
    });
  });
});
