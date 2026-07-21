import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LoginPage } from "./index";
import { useRouter, useSession } from "@variamosple/variamos-components";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";

import { AppConfig } from "@/shared/infrastructure/AppConfig";

import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

// Mock @variamosple/variamos-components to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => ({
  withPageVisit: (component: any) => component,
  useRouter: jest.fn(),
  useSession: jest.fn(),
  PagedModel: class PagedModel {},
}));

// Mock Subcomponents
jest.mock("../../components/GoogleLogin", () => ({
  GoogleLogin: () => <div data-testid="mock-google-login">Google Login</div>,
}));

jest.mock("../../components/LoginForm", () => ({
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
  const mockNavigate = jest.fn();
  const mockSignIn = jest.fn();
  const mockSignInAsGuest = jest.fn();
  let mockQueryParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryParams = new URLSearchParams();

    (useRouter as jest.Mock).mockReturnValue({
      queryParams: mockQueryParams,
      navigate: mockNavigate,
    });

    (useSession as jest.Mock).mockReturnValue({
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
      expect(mockSignIn).toHaveBeenCalledWith({ username: "user", password: "pwd" });
    });
    expect(mockNavigate).toHaveBeenCalledWith(AppConfig.HOME_PAGE);
  });

  it("handles failed sign in and displays error message", async () => {
    mockSignIn.mockResolvedValueOnce({ errorCode: 401, message: "Invalid credentials" });
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
    mockSignInAsGuest.mockResolvedValueOnce({ errorCode: null, data: { redirect: "/dashboard" } });
    renderLoginPage();

    const user = userEvent.setup();
    await user.click(screen.getByText("Continue as a Guest"));

    await waitFor(() => {
      expect(mockSignInAsGuest).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("handles guest sign in failure", async () => {
    mockSignInAsGuest.mockResolvedValueOnce({ errorCode: 500, message: "Server error" });
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
