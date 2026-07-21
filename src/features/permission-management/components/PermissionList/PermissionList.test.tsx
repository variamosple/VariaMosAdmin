import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PermissionList } from "./index";
import { Permission } from "../../domain/Entity/Permission";

const mockPermissions: Permission[] = [
  { id: 1, name: "read:users" },
  { id: 2, name: "write:users" },
];

// Mock the variamos-components library which has Paginator
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
  };
});

describe("PermissionList Component", () => {
  const mockOnPermissionEdit = jest.fn();
  const mockOnPermissionDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a list of permissions correctly", () => {
    render(
      <PermissionList
        items={mockPermissions}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onPermissionEdit={mockOnPermissionEdit}
        onPermissionDelete={mockOnPermissionDelete}
      />,
    );

    // Check permissions are rendered
    expect(screen.getByText("read:users")).toBeInTheDocument();
    expect(screen.getByText("write:users")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("triggers onPermissionEdit when the edit button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PermissionList
        items={mockPermissions}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onPermissionEdit={mockOnPermissionEdit}
        onPermissionDelete={mockOnPermissionDelete}
      />,
    );

    // Find and click the edit button for the first permission
    const editButtons = screen.getAllByTitle("Edit permission");
    await user.click(editButtons[0]);

    expect(mockOnPermissionEdit).toHaveBeenCalledTimes(1);
    expect(mockOnPermissionEdit).toHaveBeenCalledWith(mockPermissions[0]);
  });

  it("triggers onPermissionDelete when the delete button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PermissionList
        items={mockPermissions}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onPermissionEdit={mockOnPermissionEdit}
        onPermissionDelete={mockOnPermissionDelete}
      />,
    );

    // Find and click the delete button for the second permission
    const deleteButtons = screen.getAllByTitle("Delete permission");
    await user.click(deleteButtons[1]);

    expect(mockOnPermissionDelete).toHaveBeenCalledTimes(1);
    expect(mockOnPermissionDelete).toHaveBeenCalledWith(mockPermissions[1]);
  });
});
