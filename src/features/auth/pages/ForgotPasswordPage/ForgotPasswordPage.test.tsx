import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ForgotPasswordPage } from "./index";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

import { MemoryRouter } from "react-router-dom";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

// Mock @variamosple/variamos-components to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => ({
  withPageVisit: (component: any) => component,
  PagedModel: class PagedModel {},
  ResponseModel: class ResponseModel {
    errorCode?: number | null;
    message?: string;
    constructor(code?: number | null, msg?: string) {
      this.errorCode = code;
      this.message = msg;
    }
  },
}));

// Mock ForgotPasswordForm
jest.mock("../../components/ForgotPasswordForm", () => ({
  ForgotPasswordForm: ({ onSubmitEmail, isLoading }: any) => (
    <div>
      <span>Loading: {isLoading ? "Yes" : "No"}</span>
      <button data-testid="mock-forgot-form" onClick={() => onSubmitEmail("test@example.com")}>
        Submit Email
      </button>
    </div>
  ),
}));

describe("ForgotPasswordPage Component", () => {
  it("renders page correctly in initial state", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    expect(screen.getByAltText("Variamos logo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByTestId("mock-forgot-form")).toBeInTheDocument();
    expect(screen.getByText("Back to Sign In")).toBeInTheDocument();
  });

  it("handles successful password reset request and shows success screen", async () => {
    let resolveRequest: any;
    const requestPromise = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    let forgotPasswordCalled = false;
    server.use(
      http.post(apiTarget("/auth/forgot-password"), async () => {
        forgotPasswordCalled = true;
        await requestPromise;
        return HttpResponse.json({ errorCode: null });
      }),
    );

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("mock-forgot-form"));

    // Verify loading state while API call is pending
    expect(screen.getByText("Loading: Yes")).toBeInTheDocument();

    // Resolve the API call
    resolveRequest();

    await screen.findByText(/If an account with this email exists/i);
    expect(forgotPasswordCalled).toBe(true);
    expect(screen.queryByRole("heading", { name: /forgot password/i })).not.toBeInTheDocument();
  });

  it("handles API failure response and displays custom error message", async () => {
    server.use(
      http.post(apiTarget("/auth/forgot-password"), () => {
        return HttpResponse.json({
          errorCode: 400,
          message: "Invalid email domain",
        });
      }),
    );

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("mock-forgot-form"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email domain")).toBeInTheDocument();
    });
  });

  it("handles exception thrown by requestPasswordReset", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    server.use(
      http.post(apiTarget("/auth/forgot-password"), () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("mock-forgot-form"));

    await waitFor(() => {
      expect(screen.getByText("Error sending reset link. Please try again.")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
