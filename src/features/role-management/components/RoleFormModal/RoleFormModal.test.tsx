import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { RoleFormModal } from "./index";
import { Role } from "@/features/role-management/domain/Entity/Role";

jest.mock("@variamosple/variamos-components", () => {
  return {
    ResponseModel: class ResponseModel {
      errorCode?: number | null = null;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };
});

describe("RoleFormModal Component", () => {
  const mockOnClose = jest.fn();
  const mockOnRoleSubmit = jest.fn();
  const defaultRole: Role = { id: 1, name: "Admin" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when showModal is true", () => {
    render(
      <RoleFormModal
        modalTitle="Create New Role"
        showModal={true}
        onClose={mockOnClose}
        onRoleSubmit={mockOnRoleSubmit}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Create New Role")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Role name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create role/i })).toBeInTheDocument();
  });

  it("does not render when showModal is false", () => {
    render(
      <RoleFormModal
        modalTitle="Create New Role"
        showModal={false}
        onClose={mockOnClose}
        onRoleSubmit={mockOnRoleSubmit}
        isLoading={false}
      />,
    );

    expect(screen.queryByText("Create New Role")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RoleFormModal
        modalTitle="Create New Role"
        showModal={true}
        onClose={mockOnClose}
        onRoleSubmit={mockOnRoleSubmit}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("shows validation error if Role Name is submitted empty", async () => {
    const user = userEvent.setup();
    render(
      <RoleFormModal
        modalTitle="Create New Role"
        showModal={true}
        onClose={mockOnClose}
        onRoleSubmit={mockOnRoleSubmit}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Create role/i }));

    expect(await screen.findByText("Role name is required")).toBeInTheDocument();
    expect(mockOnRoleSubmit).not.toHaveBeenCalled();
  });

  it("calls onRoleSubmit with the input value on valid submission", async () => {
    mockOnRoleSubmit.mockResolvedValue({ errorCode: null });

    render(
      <RoleFormModal
        modalTitle="Create New Role"
        showModal={true}
        onClose={mockOnClose}
        onRoleSubmit={mockOnRoleSubmit}
        isLoading={false}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Role name"), "Manager");

    await user.click(screen.getByRole("button", { name: /Create role/i }));

    await waitFor(() => {
      expect(mockOnRoleSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Manager" }));
    });
  });

  it("populates form with defaultValue when provided", () => {
    render(
      <RoleFormModal
        modalTitle="Edit Role"
        showModal={true}
        onClose={mockOnClose}
        defaultValue={defaultRole}
        onRoleSubmit={mockOnRoleSubmit}
        isLoading={false}
      />,
    );

    expect(screen.getByPlaceholderText("Role name")).toHaveValue("Admin");
  });

  it("displays spinner and disables buttons when isLoading is true", () => {
    render(
      <RoleFormModal
        modalTitle="Create New Role"
        showModal={true}
        onClose={mockOnClose}
        onRoleSubmit={mockOnRoleSubmit}
        isLoading={true}
      />,
    );

    expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "" })).toBeDisabled(); // Spinner button doesn't have text
  });
});
