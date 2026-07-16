import React from "react";
import { render, screen } from "@testing-library/react";
import { SecurityWrapper } from "./index";
import * as AxiosConfig from "@/shared/infrastructure/AxiosConfig";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("SecurityWrapper Component", () => {
  let setupSpy: jest.SpyInstance;

  beforeEach(() => {
    setupSpy = jest.spyOn(AxiosConfig, "setupAxiosInterceptors").mockReturnValue(999);
  });

  afterEach(() => {
    setupSpy.mockRestore();
  });

  it("renders children and sets up/ejects interceptors during lifecycle", () => {
    const { unmount } = render(
      <SecurityWrapper>
        <div data-testid="child">Protected Content</div>
      </SecurityWrapper>,
    );

    // Verify it renders children
    expect(screen.getByTestId("child").textContent).toBe("Protected Content");

    // Verify setupAxiosInterceptors was called
    expect(setupSpy).toHaveBeenCalledWith(AxiosConfig.ADMIN_CLIENT, mockNavigate);

    // Spy on the eject function of interceptors
    const ejectSpy = jest.spyOn(AxiosConfig.ADMIN_CLIENT.interceptors.response, "eject");

    // Unmount to trigger cleanup
    unmount();

    // Verify eject was called with mock interceptorId 999
    expect(ejectSpy).toHaveBeenCalledWith(999);
  });
});
