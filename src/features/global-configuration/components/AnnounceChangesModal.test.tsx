import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import * as NotificationsAdminRepository from "@/features/notifications-admin/api/NotificationsAdminRepository";
import * as RoleRepository from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { AnnounceChangesModal } from "./AnnounceChangesModal";

vi.mock("@variamosple/variamos-components", async () =>
  (
    await import("@/shared/tests/mocks/variamosComponents")
  ).variamosComponents(),
);

const ANNOUNCEMENT = {
  keys: ["security.password.min_length"],
  title: "Password rules updated",
  body: "Passwords must now have at least 14 characters.",
};

const counted = (count: number) => {
  const response = new ResponseModel<{ count: number }>("count");
  response.data = { count };
  return response;
};

describe("AnnounceChangesModal (EV-115 lot A)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the edited text to the whole site after the count is confirmed", async () => {
    const count = vi
      .spyOn(NotificationsAdminRepository, "countNotificationRecipients")
      .mockResolvedValue(counted(230));
    const dispatch = vi
      .spyOn(NotificationsAdminRepository, "dispatchNotification")
      .mockResolvedValue(new ResponseModel<void>("dispatch"));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <AnnounceChangesModal announcement={ANNOUNCEMENT} onClose={onClose} />,
    );

    await user.type(screen.getByLabelText("Message"), " Thank you.");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText(
        'Send "Password rules updated" to 230 accounts? A sent notification cannot be recalled.',
      ),
    ).toBeInTheDocument();
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({ audience: "broadcast" }),
    );
    expect(dispatch).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Send to 230 accounts" }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(dispatch).toHaveBeenCalledWith({
      audience: "broadcast",
      roles: undefined,
      title: "Password rules updated",
      body: "Passwords must now have at least 14 characters. Thank you.",
      announces: ["security.password.min_length"],
      eventId: expect.any(String),
    });
  });

  it("asks for a role before counting, then sends to the chosen roles", async () => {
    const roles = new ResponseModel<Role[]>("roles");
    roles.data = [
      { id: 1, name: "Administrator" },
      { id: 3, name: "Product line designer" },
    ];
    vi.spyOn(RoleRepository, "queryRoleChoices").mockResolvedValue(roles);
    const count = vi
      .spyOn(NotificationsAdminRepository, "countNotificationRecipients")
      .mockResolvedValue(counted(1));
    const user = userEvent.setup();
    render(
      <AnnounceChangesModal announcement={ANNOUNCEMENT} onClose={vi.fn()} />,
    );

    await user.click(screen.getByLabelText("Some roles"));
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(
      screen.getByText("Please select at least one role."),
    ).toBeInTheDocument();
    expect(count).not.toHaveBeenCalled();

    await user.click(await screen.findByLabelText("Administrator"));
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByRole("button", { name: "Send to 1 account" }),
    ).toBeInTheDocument();
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({ audience: "role", roles: ["Administrator"] }),
    );
  });

  it("keeps the dialog open with the reason when the dispatch fails", async () => {
    vi.spyOn(
      NotificationsAdminRepository,
      "countNotificationRecipients",
    ).mockResolvedValue(counted(2));
    vi.spyOn(
      NotificationsAdminRepository,
      "dispatchNotification",
    ).mockResolvedValue(
      new ResponseModel<void>("dispatch").withError(500, "Service down."),
    );
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <AnnounceChangesModal announcement={ANNOUNCEMENT} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.click(
      await screen.findByRole("button", { name: "Send to 2 accounts" }),
    );

    expect(await screen.findByText("Service down.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
