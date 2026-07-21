import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { RolePermissionList } from "./index";

// Mock dependencies
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: function DummyPaginator({ currentPage, totalPages, onPageChange }: any) {
      return (
        <div data-testid="paginator">
          <span data-testid="current-page">{currentPage}</span>
          <span data-testid="total-pages">{totalPages}</span>
          <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
        </div>
      );
    },
  };
});

describe("RolePermissionList", () => {
  const mockOnPageChange = jest.fn();
  const mockOnPermissionDelete = jest.fn();

  const items = [
    { id: 1, name: "Permission One" },
    { id: 2, name: "Permission Two" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render table headers and permission items correctly", () => {
    render(
      <RolePermissionList
        items={items}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        onPermissionDelete={mockOnPermissionDelete}
      />,
    );

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    expect(screen.getByText("Permission One")).toBeInTheDocument();
    expect(screen.getByText("Permission Two")).toBeInTheDocument();
    expect(screen.getAllByText("1")[0]).toBeInTheDocument();
    expect(screen.getAllByText("2")[0]).toBeInTheDocument();
  });

  it("should trigger onPermissionDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RolePermissionList
        items={items}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        onPermissionDelete={mockOnPermissionDelete}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Delete role permission" });
    expect(deleteButtons).toHaveLength(2);

    await user.click(deleteButtons[0]);
    expect(mockOnPermissionDelete).toHaveBeenCalledWith(items[0]);
  });

  it("should render Paginator and trigger page change", async () => {
    const user = userEvent.setup();
    render(
      <RolePermissionList
        items={items}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        onPermissionDelete={mockOnPermissionDelete}
      />,
    );

    const paginators = screen.getAllByTestId("paginator");
    expect(paginators).toHaveLength(2); // One at the top, one at the bottom

    const nextButtons = screen.getAllByText("Next");
    await user.click(nextButtons[0]);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });
});
