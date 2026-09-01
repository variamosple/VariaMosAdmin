import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryRoles } from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { queryUsers } from "@/features/user-management/api/UserRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import { dispatchNotification } from "../api/NotificationsAdminRepository";
import { NotificationsAdminPage } from "./NotificationsAdminPage";

// Mock API repositories
vi.mock("@/features/user-management/api/UserRepository", () => ({
  queryUsers: vi.fn(),
}));

vi.mock("@/features/role-management/api/RoleRepository", () => ({
  queryRoles: vi.fn(),
}));

vi.mock("../api/NotificationsAdminRepository", () => ({
  dispatchNotification: vi.fn(),
}));

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
  });

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
});
