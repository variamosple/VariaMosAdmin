import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ResetPasswordPage } from "./index";
import { useSearchParams, useNavigate } from "react-router-dom";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

// Mock react-router-dom hooks
jest.mock("react-router-dom", () => ({
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

// Mock components
jest.mock("../../components/ResetPasswordForm", () => ({
  ResetPasswordForm: ({ onSubmitPassword, isLoading }: any) => (
    <div>
      <span>Loading: {isLoading ? "Yes" : "No"}</span>
      <button data-testid="mock-reset-form" onClick={() => onSubmitPassword("NewPassword123!")}>
        Submit Reset
      </button>
    </div>
  ),
}));

// Mock components module to prevent ESM errors
jest.mock("@variamosple/variamos-components", () => ({
  withPageVisit: (component: any) => component,
  PagedModel: class PagedModel {},
}));

describe("ResetPasswordPage Component", () => {
  const mockNavigate = jest.fn();
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSearchParams = new URLSearchParams();
    (useSearchParams as jest.Mock).mockReturnValue([mockSearchParams]);
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows invalid token message if token is missing in URL", async () => {
    render(<ResetPasswordPage />);

    await screen.findByText(/This password reset link is invalid/i);
    expect(screen.getByText("Request a new link")).toBeInTheDocument();
  });

  it("shows invalid token message if token verification fails", async () => {
    let verifyTokenCalledWith: string | null = null;
    server.use(
      http.get(apiTarget("/auth/verify-token"), ({ request }) => {
        const url = new URL(request.url);
        verifyTokenCalledWith = url.searchParams.get("token");
        return HttpResponse.json({ errorCode: 400 });
      }),
    );

    mockSearchParams.set("token", "invalid-token");

    render(<ResetPasswordPage />);

    await screen.findByText(/This password reset link is invalid/i);
    expect(verifyTokenCalledWith).toBe("invalid-token");
  });

  it("shows invalid token message if token verification throws error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let verifyTokenCalledWith: string | null = null;
    server.use(
      http.get(apiTarget("/auth/verify-token"), ({ request }) => {
        const url = new URL(request.url);
        verifyTokenCalledWith = url.searchParams.get("token");
        return new HttpResponse(null, { status: 500 });
      }),
    );

    mockSearchParams.set("token", "error-token");

    render(<ResetPasswordPage />);

    await screen.findByText(/This password reset link is invalid/i);
    expect(verifyTokenCalledWith).toBe("error-token");

    consoleSpy.mockRestore();
  });

  it("renders form when token is successfully verified", async () => {
    server.use(
      http.get(apiTarget("/auth/verify-token"), () => {
        return HttpResponse.json({ errorCode: null });
      }),
    );

    mockSearchParams.set("token", "valid-token");

    render(<ResetPasswordPage />);

    await screen.findByTestId("mock-reset-form");
    expect(
      screen.getByText("Enter your new password to reset your account credentials."),
    ).toBeInTheDocument();
  });

  it("handles successful password reset submit and redirects after timeout", async () => {
    let resetPasswordPayload: any = null;
    server.use(
      http.get(apiTarget("/auth/verify-token"), () => {
        return HttpResponse.json({ errorCode: null });
      }),
      http.post(apiTarget("/auth/reset-password"), async ({ request }) => {
        resetPasswordPayload = await request.json();
        return HttpResponse.json({ errorCode: null });
      }),
    );

    mockSearchParams.set("token", "valid-token");

    render(<ResetPasswordPage />);

    await screen.findByTestId("mock-reset-form");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByTestId("mock-reset-form"));

    expect(
      await screen.findByText(/Your password has been reset successfully/i),
    ).toBeInTheDocument();
    expect(resetPasswordPayload).toEqual({
      token: "valid-token",
      password: "NewPassword123!",
    });

    // Fast-forward 3 seconds for the navigate redirection timer
    jest.advanceTimersByTime(3000);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("handles failed password reset submit with specific same password error", async () => {
    server.use(
      http.get(apiTarget("/auth/verify-token"), () => {
        return HttpResponse.json({ errorCode: null });
      }),
      http.post(apiTarget("/auth/reset-password"), () => {
        return HttpResponse.json({
          errorCode: 400,
          message: "New password cannot be the same as the old password",
        });
      }),
    );

    mockSearchParams.set("token", "valid-token");

    render(<ResetPasswordPage />);

    await screen.findByTestId("mock-reset-form");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByTestId("mock-reset-form"));

    expect(
      await screen.findByText("New password must be different from the current one."),
    ).toBeInTheDocument();
  });

  it("handles generic failed password reset submit error", async () => {
    server.use(
      http.get(apiTarget("/auth/verify-token"), () => {
        return HttpResponse.json({ errorCode: null });
      }),
      http.post(apiTarget("/auth/reset-password"), () => {
        return HttpResponse.json({
          errorCode: 400,
          message: "Generic error",
        });
      }),
    );

    mockSearchParams.set("token", "valid-token");

    render(<ResetPasswordPage />);

    await screen.findByTestId("mock-reset-form");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByTestId("mock-reset-form"));

    expect(await screen.findByText("Generic error")).toBeInTheDocument();
  });

  it("handles exception thrown by resetPassword", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    server.use(
      http.get(apiTarget("/auth/verify-token"), () => {
        return HttpResponse.json({ errorCode: null });
      }),
      http.post(apiTarget("/auth/reset-password"), () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    mockSearchParams.set("token", "valid-token");

    render(<ResetPasswordPage />);

    await screen.findByTestId("mock-reset-form");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByTestId("mock-reset-form"));

    expect(
      await screen.findByText("Error modifying password. Please try again."),
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
