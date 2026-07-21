import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GoogleLogin } from "./index";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

describe("GoogleLogin Component", () => {
  let mockInitialize: jest.Mock;
  let mockRenderButton: jest.Mock;
  let originalGoogle: any;

  beforeEach(() => {
    jest.useFakeTimers();
    originalGoogle = (window as any).google;
    mockInitialize = jest.fn();
    mockRenderButton = jest.fn();
  });

  afterEach(() => {
    (window as any).google = originalGoogle;
    jest.useRealTimers();
  });

  it("renders the sign-in container div", () => {
    render(<GoogleLogin />);
    const container = screen.getByTestId("google-signin-container");
    expect(container).toBeInTheDocument();
  });

  it("initializes Google Sign-In and renders button immediately if window.google is defined", () => {
    (window as any).google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
        },
      },
    };

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
    delete (window as any).google;

    render(<GoogleLogin text="signin_with" />);

    // Initially should not be called since google is undefined
    expect(mockInitialize).not.toHaveBeenCalled();

    // Now define window.google
    (window as any).google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
        },
      },
    };

    // Fast-forward interval timer
    jest.advanceTimersByTime(100);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockRenderButton).toHaveBeenCalled();
  });
});
