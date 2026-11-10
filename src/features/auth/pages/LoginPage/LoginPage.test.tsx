import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { useRouter, useSession } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import type { Credentials } from "@/features/user-management/domain/Entity/Credentials";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { pageLoader } from "@/shared/infrastructure/PageLoader";
import { server } from "@/shared/tests/mocks/server";
import { LoginPage } from "./index";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

// Mock Subcomponents
vi.mock("../../components/GoogleLogin", async () => ({
  GoogleLogin: () => <div data-testid="mock-google-login">Google Login</div>,
}));

vi.mock("../../components/LoginForm", async () => ({
  LoginForm: ({
    onSignIn,
  }: {
    onSignIn: (
      credentials: import("@/features/user-management/domain/Entity/Credentials").Credentials,
    ) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-login-form"
      onClick={() => {
        interface MockCredentialsShape {
          username: string;
          email?: string;
          password: string;
        }
        const payload = { username: "user", password: "pwd" };
        onSignIn(payload as MockCredentialsShape as Credentials);
      }}
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

  it("shows the message of the reason in the address", () => {
    mockQueryParams.set("reason", "session-expired");
    renderLoginPage();
    expect(
      screen.getByText("Your session has ended. Please sign in again."),
    ).toBeInTheDocument();
  });

  it("never shows a text read from the address", () => {
    mockQueryParams.set(
      "errorMessage",
      "Call +1 555 0100 to unlock your account",
    );
    renderLoginPage();
    expect(screen.queryByText(/555 0100/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Sign-in failed. Please try again."),
    ).toBeInTheDocument();
  });

  it("registers redirect if queryParams contains redirectTo", async () => {
    let redirectUrlCalledWith: string | null = null;
    server.use(
      http.post(apiTarget("/auth/redirects"), async ({ request }) => {
        const body = (await request.json()) as { url: string };
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

  it("does not keep a script address as the page to go back to", async () => {
    const registered = vi.fn();
    server.use(
      http.post(apiTarget("/auth/redirects"), () => {
        registered();
        return HttpResponse.json({ errorCode: null });
      }),
    );

    mockQueryParams.set("redirectTo", "javascript:alert(1)");
    renderLoginPage();

    expect(
      await screen.findByRole("button", { name: "Continue as a Guest" }),
    ).toBeInTheDocument();
    expect(registered).not.toHaveBeenCalled();
  });

  it("goes home rather than to a script address after sign-in", async () => {
    mockSignInAsGuest.mockResolvedValueOnce({
      errorCode: null,
      data: { redirect: "javascript:alert(1)" },
    });
    renderLoginPage();

    await userEvent.click(screen.getByText("Continue as a Guest"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(AppConfig.HOME_PAGE);
    });
  });

  describe("second factor", () => {
    const answerCode = (status: number, body: object) =>
      server.use(
        http.post(apiTarget("/auth/sign-in/mfa"), () =>
          HttpResponse.json(body, { status }),
        ),
      );

    const reachCodeStep = async (trustedDeviceDays = 0) => {
      mockSignIn.mockResolvedValueOnce({
        errorCode: 428,
        data: { mfaRequired: true, trustedDeviceDays },
      });
      renderLoginPage();
      const user = userEvent.setup();
      await user.click(screen.getByTestId("mock-login-form"));
      await screen.findByLabelText("Authentication code");
      return user;
    };

    const typeCode = async (
      user: ReturnType<typeof userEvent.setup>,
      code: string,
    ) => {
      await user.type(screen.getByLabelText("Authentication code"), code);
      await user.click(screen.getByRole("button", { name: "Verify" }));
    };

    it("asks for the code after the password, without an error", async () => {
      await reachCodeStep();

      expect(screen.queryByTestId("mock-login-form")).toBeNull();
      expect(screen.queryByTestId("mock-google-login")).toBeNull();
      expect(screen.queryByText("Continue as a Guest")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("loads the page again once the code is right", async () => {
      const load = vi.spyOn(pageLoader, "load").mockImplementation(() => {});
      answerCode(200, { data: { redirect: "https://app.example/home" } });
      const user = await reachCodeStep();

      await typeCode(user, "123456");

      await waitFor(() =>
        expect(load).toHaveBeenCalledWith("https://app.example/home"),
      );
    });

    it("loads the home page rather than a script address", async () => {
      const load = vi.spyOn(pageLoader, "load").mockImplementation(() => {});
      answerCode(200, { data: { redirect: "javascript:alert(1)" } });
      const user = await reachCodeStep();

      await typeCode(user, "123456");

      await waitFor(() =>
        expect(load).toHaveBeenCalledWith(AppConfig.HOME_PAGE),
      );
    });

    it("keeps the code step after a wrong code", async () => {
      answerCode(400, {
        errorCode: "INVALID_INPUT",
        message: "The code is incorrect.",
      });
      const user = await reachCodeStep();

      await typeCode(user, "000000");

      expect(
        await screen.findByText("The code is incorrect."),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Authentication code")).toBeInTheDocument();
    });

    it("asks for the password again when the sign-in has expired", async () => {
      answerCode(401, {
        errorCode: "UNAUTHORIZED_ACCESS",
        message: "Your sign-in has expired, please sign in again.",
      });
      const user = await reachCodeStep();

      await typeCode(user, "123456");

      expect(
        await screen.findByText(
          "Your sign-in has expired, please sign in again.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId("mock-login-form")).toBeInTheDocument();
    });

    it("goes back to the password on request", async () => {
      const user = await reachCodeStep();

      await user.click(screen.getByRole("button", { name: "Back to sign in" }));

      expect(screen.getByTestId("mock-login-form")).toBeInTheDocument();
    });

    it("asks for the code after a Google sign-in", () => {
      mockQueryParams.set("mfa", "required");
      mockQueryParams.set("trustedDeviceDays", "7");

      renderLoginPage();

      expect(screen.getByLabelText("Authentication code")).toBeInTheDocument();
      expect(
        screen.getByLabelText(
          "Don't ask for a code on this browser for 7 days",
        ),
      ).toBeInTheDocument();
    });

    it("sends the choice not to be asked again on this browser", async () => {
      vi.spyOn(pageLoader, "load").mockImplementation(() => {});
      let body: { code: string; rememberDevice: boolean } | undefined;
      server.use(
        http.post(apiTarget("/auth/sign-in/mfa"), async ({ request }) => {
          body = (await request.json()) as typeof body;
          return HttpResponse.json({ data: { redirect: "/" } });
        }),
      );
      const user = await reachCodeStep(14);

      await user.click(
        screen.getByLabelText(
          "Don't ask for a code on this browser for 14 days",
        ),
      );
      await typeCode(user, "123456");

      await waitFor(() =>
        expect(body).toEqual({ code: "123456", rememberDevice: true }),
      );
    });
  });
});
