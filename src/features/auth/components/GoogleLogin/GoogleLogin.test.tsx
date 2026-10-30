import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { GoogleLogin } from "./index";

describe("GoogleLogin Component", () => {
  let mockInitialize: import("vitest").Mock;
  let mockRenderButton: import("vitest").Mock;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockInitialize = vi.fn();
    mockRenderButton = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the sign-in container div", () => {
    render(<GoogleLogin />);
    const container = screen.getByTestId("google-signin-container");
    expect(container).toBeInTheDocument();
  });

  it("initializes Google Sign-In and renders button immediately if window.google is defined", () => {
    vi.stubGlobal("google", {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
        },
      },
    });

    render(<GoogleLogin text="signup_with" />);

    expect(mockInitialize).toHaveBeenCalledWith({
      client_id: AppConfig.GOOGLE.CLIENT_ID,
      context: "signin",
      ux_mode: "redirect",
      login_uri: AppConfig.GOOGLE.REDIRECT_URI,
    });

    expect(mockRenderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        theme: "outline",
        type: "standard",
        text: "signup_with",
        shape: "rectangular",
        size: "large",
        width: "300",
        locale: "en",
        logo_alignment: "left",
      }),
    );
  });

  it("polls for window.google if it is initially undefined", () => {
    vi.stubGlobal("google", undefined);

    render(<GoogleLogin text="signin_with" />);

    // Initially should not be called since google is undefined
    expect(mockInitialize).not.toHaveBeenCalled();

    // Now define window.google
    vi.stubGlobal("google", {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
        },
      },
    });

    // Fast-forward interval timer
    vi.advanceTimersByTime(100);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockRenderButton).toHaveBeenCalled();
  });

  it("stops waiting for the Google script when the page is left", () => {
    vi.stubGlobal("google", undefined);
    const { unmount } = render(<GoogleLogin />);
    expect(vi.getTimerCount()).toBe(1);

    // The script never loads (blocked, offline): nothing keeps checking
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
