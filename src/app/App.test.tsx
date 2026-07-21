import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

// Mock @variamosple/variamos-components
jest.mock("@variamosple/variamos-components", () => {
  const React = require("react");
  return {
    AnalyticsProvider: ({ children }: any) => (
      <div data-testid="mock-analytics-provider">{children}</div>
    ),
    SessionProvider: ({ children }: any) => (
      <div data-testid="mock-session-provider">{children}</div>
    ),
    AuthWrapper: ({ children }: any) => <div data-testid="mock-auth-wrapper">{children}</div>,
    ProtectedRoute: ({ children }: any) => <div data-testid="mock-protected-route">{children}</div>,
    RouterContext: React.createContext(null),
    getBasePath: () => "/vms",
    isAbsoluteUrl: (url: string) => url.startsWith("http://") || url.startsWith("https://"),
    Events: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    },
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
  };
});

// Mock feature APIs
jest.mock("@/features/auth", () => ({
  getSessionInfo: jest.fn(),
  requestLogout: jest.fn(),
  requestSignIn: jest.fn(),
  requestSignInAsGuest: jest.fn(),
  requestSignUp: jest.fn(),
}));

// Mock the router configuration to avoid importing real pages and layouts (which cause ESM errors)
jest.mock("./router", () => {
  const React = require("react");
  return {
    ROUTES: [
      {
        path: "/",
        element: React.createElement(
          "div",
          { "data-testid": "mock-home-page" },
          "HomePage Content",
        ),
      },
    ],
  };
});

describe("App Component", () => {
  it("renders providers and the default route without crashing", () => {
    render(<App />);

    // Assert that the context providers are rendered
    expect(screen.getByTestId("mock-analytics-provider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-session-provider")).toBeInTheDocument();

    // The default route is "/" which maps to our mock element
    expect(screen.getByTestId("mock-home-page")).toHaveTextContent("HomePage Content");
  });
});
