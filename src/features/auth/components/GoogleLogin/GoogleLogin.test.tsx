import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { GOOGLE_SIGN_IN_SCRIPT } from "./googleSignInScript";
import { GoogleLogin } from "./index";

const googleScripts = () =>
  document.head.querySelectorAll(`script[src="${GOOGLE_SIGN_IN_SCRIPT}"]`);

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
    vi.unstubAllGlobals();
    for (const script of googleScripts()) script.remove();
  });

  it("renders the sign-in container div", () => {
    render(<GoogleLogin />);
    const container = screen.getByTestId("google-signin-container");
    expect(container).toBeInTheDocument();
  });

  // The button of Google appears later: its place is kept so the form does
  // not move under a click
  it("keeps the height of the Google button before it renders", () => {
    vi.stubGlobal("google", undefined);

    render(<GoogleLogin />);

    expect(screen.getByTestId("google-signin-container")).toHaveStyle({
      minHeight: "40px",
    });
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

    expect(mockInitialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: AppConfig.GOOGLE.CLIENT_ID }),
    );
    expect(mockRenderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ text: "signin_with" }),
    );
  });

  it("stops waiting for the Google script when the page is left", () => {
    vi.stubGlobal("google", undefined);
    const { unmount } = render(<GoogleLogin />);
    expect(vi.getTimerCount()).toBe(1);

    // The script never loads (blocked, offline): nothing keeps checking
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  // ADM-N45: the script is no longer in index.html, for every page
  it("adds the Google script once, from the page that shows the button", () => {
    vi.stubGlobal("google", undefined);

    const first = render(<GoogleLogin />);
    first.unmount();
    render(<GoogleLogin text="signup_with" />);

    const scripts = googleScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveProperty("async", true);
  });

  it("adds no script when Google is already loaded", () => {
    vi.stubGlobal("google", {
      accounts: {
        id: { initialize: mockInitialize, renderButton: mockRenderButton },
      },
    });

    render(<GoogleLogin />);

    expect(googleScripts()).toHaveLength(0);
  });
});
