import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { useRouter, useSession } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { useLocation } from "react-router-dom";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { INVITATION_PAUSE_MS, MfaInvitationBanner, managesOthers } from ".";

vi.mock("react-router-dom", async () => ({ useLocation: vi.fn() }));

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const navigate = vi.fn();
const MANAGER = ["users::query", "users::update", "my-account::query"];
const INVITATION = /Protect your account/;

const signedInAs = (permissions: string[], id = "user-1") => {
  (useSession as import("vitest").Mock).mockReturnValue({
    user: { id, user: id, name: id, email: "", roles: [], permissions },
  });
};

/** The admin's answer about one's own second factor, and how often asked. */
function mfaServer(status: { available: boolean; enabled: boolean }) {
  const calls = { count: 0 };
  server.use(
    http.get(apiTarget("/auth/mfa"), () => {
      calls.count += 1;
      return HttpResponse.json({
        data: { ...status, recoveryCodesRemaining: 0 },
      });
    }),
  );
  return calls;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("MfaInvitationBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useRouter as import("vitest").Mock).mockReturnValue({ navigate });
    vi.mocked(useLocation).mockReturnValue({
      pathname: "/",
    } as ReturnType<typeof useLocation>);
  });

  it("invites an account that manages others and has no second factor", async () => {
    mfaServer({ available: true, enabled: false });
    signedInAs(MANAGER);

    render(<MfaInvitationBanner />);

    expect(await screen.findByText(INVITATION)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Turn it on" }));
    expect(navigate).toHaveBeenCalledWith("/my-account");
  });

  it.each([
    ["the factor is on", { available: true, enabled: true }],
    ["the factor is not available", { available: false, enabled: false }],
  ])("stays hidden when %s", async (_label, status) => {
    mfaServer(status);
    signedInAs(MANAGER);

    render(<MfaInvitationBanner />);

    await settle();
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument();
  });

  it("does not ask accounts that manage nobody", async () => {
    const calls = mfaServer({ available: true, enabled: false });
    signedInAs(["my-account::query", "languages::query"]);

    render(<MfaInvitationBanner />);

    await settle();
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument();
    expect(calls.count).toBe(0);
  });

  it("stays hidden on My account, where the factor is turned on", async () => {
    mfaServer({ available: true, enabled: false });
    signedInAs(MANAGER);
    vi.mocked(useLocation).mockReturnValue({
      pathname: "/my-account",
    } as ReturnType<typeof useLocation>);

    render(<MfaInvitationBanner />);

    await settle();
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument();
  });

  it("stays closed for a week once closed", async () => {
    const calls = mfaServer({ available: true, enabled: false });
    signedInAs(MANAGER);
    const { unmount } = render(<MfaInvitationBanner />);
    await screen.findByText(INVITATION);

    await userEvent.click(screen.getByRole("button", { name: "Close alert" }));
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument();
    unmount();

    render(<MfaInvitationBanner />);
    await settle();
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument();
    expect(calls.count).toBe(1);

    localStorage.setItem(
      "mfaInvitationClosedAt:user-1",
      String(Date.now() - INVITATION_PAUSE_MS - 1),
    );
    render(<MfaInvitationBanner />);
    expect(await screen.findByText(INVITATION)).toBeInTheDocument();
  });

  it("still invites when the browser refuses its storage", async () => {
    mfaServer({ available: true, enabled: false });
    signedInAs(MANAGER);
    const getItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (key.startsWith("mfaInvitationClosedAt:")) throw new Error("blocked");
      return getItem.call(this, key);
    });

    render(<MfaInvitationBanner />);

    expect(await screen.findByText(INVITATION)).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

describe("managesOthers", () => {
  it.each([
    [["users::query"], true],
    [["roles::assign"], true],
    [["permissions::create"], true],
    [["configurations::update"], true],
    [["configurations::query", "my-account::update"], false],
    [[], false],
  ])("%j -> %s", (permissions, expected) => {
    expect(managesOthers(permissions)).toBe(expected);
  });
});
