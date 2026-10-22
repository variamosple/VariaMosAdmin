import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { useSession } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { AccountMfaSection, RESET_MFA_PERMISSION } from "./index";

const mockPushToast = vi.fn();
vi.mock("@/shared/context/ToastContext", async () => ({
  useToast: () => ({ pushToast: mockPushToast, removeToast: vi.fn() }),
}));

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const signedInAs = (id: string, permissions: string[]) => {
  (useSession as import("vitest").Mock).mockReturnValue({
    user: { id, user: id, name: id, email: "", roles: [], permissions },
  });
};

/** The admin, with the second factor of user-2 and the calls it got. */
function mfaServer(enabled: boolean, reset = { emailSent: true }) {
  const state = { enabled, deletes: 0 };
  server.use(
    http.get(apiTarget("/v1/users/user-2/mfa"), () =>
      HttpResponse.json({ data: { enabled: state.enabled } }),
    ),
    http.delete(apiTarget("/v1/users/user-2/mfa"), () => {
      state.deletes += 1;
      state.enabled = false;
      return HttpResponse.json({ data: reset });
    }),
  );
  return state;
}

describe("AccountMfaSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stays hidden without users::reset-mfa, and asks nothing", async () => {
    const state = mfaServer(true);
    signedInAs("admin-1", ["users::update"]);

    const { container } = render(<AccountMfaSection userId="user-2" />);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container).toBeEmptyDOMElement();
    expect(state.deletes).toBe(0);
  });

  it("stays hidden on one's own account", async () => {
    mfaServer(true);
    signedInAs("user-2", [RESET_MFA_PERMISSION]);

    const { container } = render(<AccountMfaSection userId="user-2" />);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container).toBeEmptyDOMElement();
  });

  it("says when the user has not turned it on, with no button", async () => {
    mfaServer(false);
    signedInAs("admin-1", [RESET_MFA_PERMISSION]);

    render(<AccountMfaSection userId="user-2" />);

    expect(
      await screen.findByText("This user has not turned it on."),
    ).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("turns it off after a confirmation, and tells the result", async () => {
    const state = mfaServer(true);
    signedInAs("admin-1", [RESET_MFA_PERMISSION]);
    render(<AccountMfaSection userId="user-2" />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Turn off two-factor authentication",
      }),
    );
    expect(state.deletes).toBe(0);
    await userEvent.click(screen.getByRole("button", { name: "Turn off" }));

    await waitFor(() =>
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Turned off. The user was told by e-mail.",
          variant: "success",
        }),
      ),
    );
    expect(state.deletes).toBe(1);
    expect(
      await screen.findByText("This user has not turned it on."),
    ).toBeInTheDocument();
  });

  it("warns when the user could not be told by e-mail", async () => {
    mfaServer(true, { emailSent: false });
    signedInAs("admin-1", [RESET_MFA_PERMISSION]);
    render(<AccountMfaSection userId="user-2" />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Turn off two-factor authentication",
      }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Turn off" }));

    await waitFor(() =>
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "warning" }),
      ),
    );
  });

  it("shows the refusal of the server", async () => {
    mfaServer(true);
    server.use(
      http.delete(apiTarget("/v1/users/user-2/mfa"), () =>
        HttpResponse.json(
          {
            errorCode: "FORBIDDEN",
            message:
              "You cannot manage an account with permissions you do not hold.",
          },
          { status: 403 },
        ),
      ),
    );
    signedInAs("admin-1", [RESET_MFA_PERMISSION]);
    render(<AccountMfaSection userId="user-2" />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Turn off two-factor authentication",
      }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Turn off" }));

    await waitFor(() =>
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "You cannot manage an account with permissions you do not hold.",
          variant: "danger",
        }),
      ),
    );
  });
});
