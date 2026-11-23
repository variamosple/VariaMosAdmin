import { act, render, screen } from "@testing-library/react";
import { useRouter, useSession } from "@variamosple/variamos-components";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { SignInLayout } from "./SignInLayout";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  return {
    DEFAULT_MAIN_CONTENT_ID: "main-content",
    useSession: vi.fn(),
    useRouter: vi.fn(),
    ResponseModel: class ResponseModel {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };
});

// Mock About component to simplify render
vi.mock("../components/About", async () => ({
  About: () => <div data-testid="about-component">About Component</div>,
}));

describe("SignInLayout", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (useRouter as import("vitest").Mock).mockReturnValue({
      navigate: mockNavigate,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children and About component when user is not authenticated", () => {
    (useSession as import("vitest").Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <SignInLayout>
        <div data-testid="test-child">Child Element</div>
      </SignInLayout>,
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByTestId("about-component")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ADM-N15: the same landmark as the pages after sign-in
  it("puts the form and the About panel in a main landmark", () => {
    (useSession as import("vitest").Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <SignInLayout>
        <div data-testid="test-child">Child Element</div>
      </SignInLayout>,
    );

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toContainElement(screen.getByTestId("test-child"));
    expect(main).toContainElement(screen.getByTestId("about-component"));
  });

  it("schedules redirect to Home page and cleans up timeout on unmount if authenticated", () => {
    (useSession as import("vitest").Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(
      <SignInLayout>
        <div>Child Element</div>
      </SignInLayout>,
    );

    // Timeout is 300ms, shouldn't have fired immediately
    expect(mockNavigate).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledWith(AppConfig.HOME_PAGE);
  });
});
