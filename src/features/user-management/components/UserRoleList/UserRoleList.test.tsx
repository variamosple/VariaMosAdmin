import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserRoleList } from "./index";
import { Role } from "@/features/role-management/domain/Entity/Role";

jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
  };
});

const mockRoles: Role[] = [
  { id: 1, name: "Admin" },
  { id: 2, name: "User" },
];

describe("UserRoleList Component", () => {
  const mockOnRoleDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders user roles table correctly", () => {
    render(
      <UserRoleList
        items={mockRoles}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onRoleDelete={mockOnRoleDelete}
      />,
    );

    expect(screen.getByText("Admin")).toBeDefined();
    expect(screen.getByText("User")).toBeDefined();
  });

  it("triggers onRoleDelete when the delete button is clicked", () => {
    render(
      <UserRoleList
        items={mockRoles}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onRoleDelete={mockOnRoleDelete}
      />,
    );

    const deleteButtons = screen.getAllByTitle("Delete user role");
    fireEvent.click(deleteButtons[0]);

    expect(mockOnRoleDelete).toHaveBeenCalledWith(mockRoles[0]);
  });
});
