import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(screen.getByText("read:users")).toBeDefined();
    expect(screen.getByText("write:users")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
  });

  it("triggers onPermissionEdit when the edit button is clicked", () => {
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
    fireEvent.click(editButtons[0]);

    expect(mockOnPermissionEdit).toHaveBeenCalledTimes(1);
    expect(mockOnPermissionEdit).toHaveBeenCalledWith(mockPermissions[0]);
  });

  it("triggers onPermissionDelete when the delete button is clicked", () => {
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
    fireEvent.click(deleteButtons[1]);

    expect(mockOnPermissionDelete).toHaveBeenCalledTimes(1);
    expect(mockOnPermissionDelete).toHaveBeenCalledWith(mockPermissions[1]);
  });
});
