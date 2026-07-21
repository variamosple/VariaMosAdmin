import React, { useContext } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { RouterProvider } from "./RouterContext";
import { RouterContext, Events } from "@variamosple/variamos-components";
import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";

// Initialize a global listener array that doesn't suffer from lexical hoisting ReferenceErrors
let mockNavigateListeners: any[] = [];

// Mock react-router-dom hooks
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock @variamosple/variamos-components
jest.mock("@variamosple/variamos-components", () => {
  const ReactContext = require("react").createContext(null);

  return {
    RouterContext: ReactContext,
    Events: {
      subscribe: jest.fn((event: string, callback: Function) => {
        mockNavigateListeners.push(callback);
      }),
      unsubscribe: jest.fn((event: string, callback: Function) => {
        mockNavigateListeners = mockNavigateListeners.filter((cb: any) => cb !== callback);
      }),
    },
    getBasePath: () => "/vms",
    isAbsoluteUrl: (url: string) => url.startsWith("http://") || url.startsWith("https://"),
  };
});

const ConsumerComponent = () => {
  const ctx = useContext(RouterContext);
  if (!ctx) return null;
  return (
    <div>
      <span data-testid="pathname">{ctx.pathname}</span>
      <span data-testid="basePath">{ctx.basePath}</span>
      <button
        data-testid="navigate-btn"
        onClick={() => ctx.navigate("/home", { target: "_blank" })}
      >
        Go Home
      </button>
      <button
        data-testid="navigate-absolute"
        onClick={() => ctx.navigate("https://google.com", { target: "_blank" })}
      >
        Go Google
      </button>
    </div>
  );
};

describe("RouterContext & RouterProvider", () => {
  const mockNavigate = jest.fn();
  const mockLocation = { pathname: "/current-page" };
  const mockParams = { id: "123" };
  const mockSearchParams = [new URLSearchParams("?q=test")];
  let originalWindowOpen: any;
  let originalLocation: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigateListeners = [];

    (Events.subscribe as jest.Mock).mockImplementation((event: string, callback: Function) => {
      mockNavigateListeners.push(callback);
    });

    (Events.unsubscribe as jest.Mock).mockImplementation((event: string, callback: Function) => {
      mockNavigateListeners = mockNavigateListeners.filter((cb: any) => cb !== callback);
    });

    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    originalWindowOpen = window.open;
    window.open = jest.fn();

    // Mock window.location.origin
    originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = {
      origin: "http://localhost:3000",
    };
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    (window as any).location = originalLocation;
  });

  it("provides RouterContext values to consumer components", () => {
    render(
      <RouterProvider>
        <ConsumerComponent />
      </RouterProvider>,
    );

    expect(screen.getByTestId("pathname")).toHaveTextContent("/current-page");
    expect(screen.getByTestId("basePath")).toHaveTextContent("/vms");
  });

  it("navigates to relative path inside VariaMos application", async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider>
        <ConsumerComponent />
      </RouterProvider>,
    );

    await user.click(screen.getByTestId("navigate-btn"));
    expect(mockNavigate).toHaveBeenCalledWith("/home", { target: "_blank" });
  });

  it("opens absolute URL in new window/tab if not in same origin", async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider>
        <ConsumerComponent />
      </RouterProvider>,
    );

    await user.click(screen.getByTestId("navigate-absolute"));
    expect(window.open).toHaveBeenCalledWith("https://google.com", "_blank");
  });

  it("subscribes to variamosNavigate event on mount and unsubscribes on unmount", () => {
    const { unmount } = render(
      <RouterProvider>
        <ConsumerComponent />
      </RouterProvider>,
    );

    expect(Events.subscribe).toHaveBeenCalledWith("variamosNavigate", expect.any(Function));

    // Trigger event using the global listeners list
    act(() => {
      mockNavigateListeners.forEach((cb: any) => {
        try {
          cb({ detail: "/somewhere-else" });
        } catch (err) {
          // ignore or handle
        }
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith("/somewhere-else", {});

    // Unmount
    unmount();
    expect(Events.unsubscribe).toHaveBeenCalledWith("variamosNavigate", expect.any(Function));
  });
});
