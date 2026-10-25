import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryRoles } from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { queryUsers } from "@/features/user-management/api/UserRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import {
  countNotificationRecipients,
  dispatchNotification,
} from "../api/NotificationsAdminRepository";
import { NotificationsAdminPage } from "./NotificationsAdminPage";

// Mock API repositories
vi.mock("@/features/user-management/api/UserRepository", () => ({
  queryUsers: vi.fn(),
}));

vi.mock("@/features/role-management/api/RoleRepository", () => ({
  queryRoles: vi.fn(),
}));

vi.mock("../api/NotificationsAdminRepository", () => ({
  countNotificationRecipients: vi.fn(),
  dispatchNotification: vi.fn(),
}));

const counted = (count: number) =>
  ({ data: { count } }) as Awaited<
    ReturnType<typeof countNotificationRecipients>
  >;

describe("NotificationsAdminPage Component Tests", () => {
  const mockUsers: User[] = [
    {
      id: "user-1",
      user: "alice",
      name: "Alice Smith",
      email: "alice@example.com",
      isEnabled: true,
      isDeleted: false,
      createdAt: new Date(),
    },
    {
      id: "user-2",
      user: "bob",
      name: "Bob Jones",
      email: "bob@example.com",
      isEnabled: true,
      isDeleted: false,
      createdAt: new Date(),
    },
  ];

  const mockRoles: Role[] = [
    { id: 1, name: "Administrator" },
    { id: 2, name: "Reviewer" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const usersResponse = new ResponseModel<User[]>("success");
    usersResponse.data = mockUsers;
    vi.mocked(queryUsers).mockResolvedValue(usersResponse);

    const rolesResponse = new ResponseModel<Role[]>("success");
    rolesResponse.data = mockRoles;
    vi.mocked(queryRoles).mockResolvedValue(rolesResponse);
    vi.mocked(countNotificationRecipients).mockResolvedValue(counted(2));
  });

  const fillAndSubmit = async () => {
    await userEvent.type(
      await screen.findByLabelText("Notification Title"),
      "Maintenance",
    );
    await userEvent.type(
      screen.getByLabelText("Message Body"),
      "Platform offline tonight.",
    );
    await userEvent.click(screen.getByRole("button", { name: /Dispatch/i }));
  };

  it("renders the page title and default audience options", async () => {
    render(<NotificationsAdminPage />);

    expect(
      screen.getByText("Manual Notifications Dashboard"),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText(/Broadcast/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/By Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Specific Users/i)).toBeInTheDocument();
  });

  it("allows selecting by roles and toggling specific roles", async () => {
    render(<NotificationsAdminPage />);

    const roleRadio = await screen.findByLabelText(/By Role/i);
    await userEvent.click(roleRadio);

    await waitFor(() => {
      expect(screen.getByLabelText("Administrator")).toBeInTheDocument();
      expect(screen.getByLabelText("Reviewer")).toBeInTheDocument();
    });

    const adminCheck = screen.getByLabelText("Administrator");
    expect(adminCheck).not.toBeChecked();
    await userEvent.click(adminCheck);
    expect(adminCheck).toBeChecked();
  });

  it("renders search input, filters users, selects tags, and removes tags", async () => {
    render(<NotificationsAdminPage />);

    const userRadio = await screen.findByLabelText(/Specific Users/i);
    await userEvent.click(userRadio);

    // Search input should appear
    const searchInput = await screen.findByPlaceholderText(
      "Search user by name or email...",
    );
    expect(searchInput).toBeInTheDocument();

    // Type query to filter
    await userEvent.type(searchInput, "Alice");

    // Alice should show up in dropdown
    const aliceItem = await screen.findByText("Alice Smith");
    expect(aliceItem).toBeInTheDocument();

    // Click item to select
    await userEvent.click(aliceItem);

    // Alice should appear as a badge tag and search input should be cleared
    expect(
      screen.getByText("Alice Smith (alice@example.com)"),
    ).toBeInTheDocument();
    expect(searchInput).toHaveValue("");

    // Click 'x' button inside the badge tag to remove her
    const removeBtn = screen.getByRole("button", { name: "×" });
    await userEvent.click(removeBtn);

    // Tag should be gone
    expect(
      screen.queryByText("Alice Smith (alice@example.com)"),
    ).not.toBeInTheDocument();
  });

  it("submits the form successfully for broadcast audience", async () => {
    const dispatchResponse = new ResponseModel<void>("success");
    vi.mocked(dispatchNotification).mockResolvedValue(dispatchResponse);
    render(<NotificationsAdminPage />);

    // Fill title and message
    const titleInput = await screen.findByLabelText("Notification Title");
    const bodyInput = screen.getByLabelText("Message Body");
    await userEvent.type(titleInput, "Maintenance");
    await userEvent.type(bodyInput, "Platform offline tonight.");

    const submitBtn = screen.getByRole("button", { name: /Dispatch/i });
    await userEvent.click(submitBtn);
    await userEvent.click(
      await screen.findByRole("button", { name: "Send to 2 accounts" }),
    );

    await waitFor(() => {
      expect(dispatchNotification).toHaveBeenCalledWith({
        audience: "broadcast",
        title: "Maintenance",
        body: "Platform offline tonight.",
        roles: undefined,
        userIds: undefined,
      });
      expect(
        screen.getByText("Notifications dispatched successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("shows the message of a failed dispatch", async () => {
    const failed = new ResponseModel<void>("dispatchNotification").withError(
      500,
      "An unexpected error occurred. Please try again later.",
    );
    vi.mocked(dispatchNotification).mockResolvedValue(failed);
    render(<NotificationsAdminPage />);

    await userEvent.type(
      await screen.findByLabelText("Notification Title"),
      "Maintenance",
    );
    await userEvent.type(
      screen.getByLabelText("Message Body"),
      "Platform offline tonight.",
    );
    await userEvent.click(screen.getByRole("button", { name: /Dispatch/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Send to 2 accounts" }),
    );

    expect(
      await screen.findByText(
        "An unexpected error occurred. Please try again later.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Notifications dispatched successfully!"),
    ).not.toBeInTheDocument();
  });

  describe("confirmation before sending (UX-02)", () => {
    it("names the notification and the number of accounts, and sends nothing on cancel", async () => {
      render(<NotificationsAdminPage />);
      await fillAndSubmit();

      const dialog = await screen.findByRole("dialog", {
        name: "Send notification",
      });
      expect(dialog).toHaveTextContent(
        'Send "Maintenance" to 2 accounts? A sent notification cannot be recalled.',
      );
      expect(countNotificationRecipients).toHaveBeenCalledWith(
        expect.objectContaining({ audience: "broadcast" }),
      );

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(dispatchNotification).not.toHaveBeenCalled();
    });

    it("sends nothing when the recipients cannot be counted", async () => {
      vi.mocked(countNotificationRecipients).mockResolvedValue({
        errorCode: 500,
        message: "Counting failed.",
      } as Awaited<ReturnType<typeof countNotificationRecipients>>);
      render(<NotificationsAdminPage />);
      await fillAndSubmit();

      expect(await screen.findByText("Counting failed.")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(dispatchNotification).not.toHaveBeenCalled();
    });

    it("sends nothing to an audience without any active account", async () => {
      vi.mocked(countNotificationRecipients).mockResolvedValue(counted(0));
      render(<NotificationsAdminPage />);
      await fillAndSubmit();

      expect(
        await screen.findByText("No active account matches this audience."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(dispatchNotification).not.toHaveBeenCalled();
    });
  });
});
