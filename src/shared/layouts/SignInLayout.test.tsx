import React from "react";
import { render, screen, act } from "@testing-library/react";
import { SignInLayout } from "./SignInLayout";
import { useSession, useRouter } from "@variamosple/variamos-components";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  return {
    useSession: vi.fn(),
    useRouter: vi.fn(),
    PagedModel: class PagedModel {},
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
    vi.useFakeTimers();
    (useRouter as import('vitest').Mock).mockReturnValue({
      navigate: mockNavigate,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children and About component when user is not authenticated", () => {
    (useSession as import('vitest').Mock).mockReturnValue({
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

  it("schedules redirect to Home page and cleans up timeout on unmount if authenticated", () => {
    (useSession as import('vitest').Mock).mockReturnValue({
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
