import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleList } from "./index";
import { Role } from "../../domain/Entity/Role";

const mockNavigate = jest.fn();

// Mock the variamos-components library completely
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: ({ currentPage, totalPages, onPageChange }: any) => (
      <div data-testid="mock-paginator">
        <span>
          Page: {currentPage} / {totalPages}
        </span>
        <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
      </div>
    ),
    useRouter: () => ({
      navigate: mockNavigate,
    }),
  };
});

describe("RoleList Component", () => {
  const mockOnRoleEdit = jest.fn();
  const mockOnRoleDelete = jest.fn();
  const mockOnPageChange = jest.fn();

  const mockRoles: Role[] = [
    { id: 1, name: "Administrator" },
    { id: 2, name: "Editor" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (items: Role[] = mockRoles) => {
    return render(
      <RoleList
        items={items}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        onRoleEdit={mockOnRoleEdit}
        onRoleDelete={mockOnRoleDelete}
      />,
    );
  };

  it("renders the table headers and list of roles", () => {
    renderComponent();

    // Table headers
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Roles details
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
  });

  it("triggers navigate when see details button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    const detailButtons = screen.getAllByTitle("See role details");
    await user.click(detailButtons[0]);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/roles/1");
  });

  it("triggers onRoleEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByTitle("Edit role");
    await user.click(editButtons[1]); // Editor role

    expect(mockOnRoleEdit).toHaveBeenCalledTimes(1);
    expect(mockOnRoleEdit).toHaveBeenCalledWith(mockRoles[1]);
  });

  it("triggers onRoleDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButtons = screen.getAllByTitle("Delete role");
    await user.click(deleteButtons[0]); // Administrator role

    expect(mockOnRoleDelete).toHaveBeenCalledTimes(1);
    expect(mockOnRoleDelete).toHaveBeenCalledWith(mockRoles[0]);
  });

  it("renders two Paginators and triggers onPageChange when page changes", async () => {
    const user = userEvent.setup();
    renderComponent();

    const paginators = screen.getAllByTestId("mock-paginator");
    expect(paginators).toHaveLength(2);

    const nextButtons = screen.getAllByRole("button", { name: "Next" });
    await user.click(nextButtons[0]);

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });
});
