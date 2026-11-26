import { render, screen } from "@testing-library/react";
import * as AxiosConfig from "@/shared/infrastructure/AxiosConfig";
import { SecurityWrapper } from "./index";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  useNavigate: () => mockNavigate,
}));
const mockCheckSession = vi.hoisted(() => vi.fn());
vi.mock("@variamosple/variamos-components", () => ({
  hasUnsavedInput: () => false,
  useSession: () => ({ checkSession: mockCheckSession }),
}));

describe("SecurityWrapper Component", () => {
  let setupSpy: import("vitest").MockInstance;

  beforeEach(() => {
    setupSpy = vi
      .spyOn(AxiosConfig, "setupAxiosInterceptors")
      .mockReturnValue(999);
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

    // Every service reads its 401 the same way; only the admin may send
    // a page without input to the sign-in page at once
    expect(setupSpy).toHaveBeenCalledWith(
      AxiosConfig.ADMIN_CLIENT,
      mockNavigate,
      mockCheckSession,
    );
    expect(setupSpy).toHaveBeenCalledWith(
      AxiosConfig.PROJECTS_CLIENT,
      null,
      mockCheckSession,
    );
    expect(setupSpy).toHaveBeenCalledWith(
      AxiosConfig.LANGUAGES_CLIENT,
      null,
      mockCheckSession,
    );

    const ejectSpies = [
      AxiosConfig.ADMIN_CLIENT,
      AxiosConfig.PROJECTS_CLIENT,
      AxiosConfig.LANGUAGES_CLIENT,
    ].map((client) => vi.spyOn(client.interceptors.response, "eject"));

    // Unmount to trigger cleanup
    unmount();

    // Verify eject was called with mock interceptorId 999
    for (const ejectSpy of ejectSpies) {
      expect(ejectSpy).toHaveBeenCalledWith(999);
    }
  });
});
