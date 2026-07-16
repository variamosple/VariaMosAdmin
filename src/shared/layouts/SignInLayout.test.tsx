import React from "react";
import { render, screen, act } from "@testing-library/react";
import { SignInLayout } from "./SignInLayout";
import { useSession, useRouter } from "@variamosple/variamos-components";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  return {
    useSession: jest.fn(),
    useRouter: jest.fn(),
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
jest.mock("../components/About", () => ({
  About: () => <div data-testid="about-component">About Component</div>,
}));

describe("SignInLayout", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders children and About component when user is not authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <SignInLayout>
        <div data-testid="test-child">Child Element</div>
      </SignInLayout>,
    );

    expect(screen.getByTestId("test-child")).toBeDefined();
    expect(screen.getByTestId("about-component")).toBeDefined();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("schedules redirect to Home page and cleans up timeout on unmount if authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
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
      jest.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledWith(AppConfig.HOME_PAGE);
  });
});
