import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";
import { server } from "@/shared/tests/mocks/server";
import { renderPage } from "@/shared/tests/render";
import { RoleListPage } from "./index";

const mockNavigate = vi.fn();

// Mock @variamosple/variamos-components to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  const React = require("react") as typeof import("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: <T,>(component: T): T => component,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
    ResponseModel: class ResponseModel<T> {
      errorCode?: number;
      message?: string;
      data?: T;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
    Paginator: () => <div data-testid="paginator">Paginator</div>,
    usePaginatedQuery: <TFilter extends { page?: number }, TData>({
      queryFunction,
      initialFilter,
    }: {
      queryFunction: (
        filter: TFilter,
      ) => Promise<{ errorCode?: number; data?: TData[]; message?: string }>;
      initialFilter: TFilter;
    }) => {
      const [data, setData] = useState<TData[]>([]);
      const [currentPage, setCurrentPage] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [isLoading, setIsLoading] = useState(false);

      const loadData = useCallback(
        async (filter: TFilter) => {
          setIsLoading(true);
          const response = await queryFunction(filter);
          if (!response.errorCode) {
            setData(response.data || []);
            setTotalPages(1);
          }
          setIsLoading(false);
          return response;
        },
        [queryFunction],
      );

      const onPageChange = useCallback(
        (page: number) => {
          setCurrentPage(page);
          loadData({ ...initialFilter, page });
        },
        [loadData, initialFilter],
      );

      return {
        data,
        currentPage,
        loadData,
        isLoading,
        totalPages,
        onPageChange,
      };
    },
  };
});

describe("RoleListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render page header, create button, and lists", async () => {
    renderPage(<RoleListPage />);
    expect(
      screen.getByRole("heading", { name: "Roles list" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create role" }),
    ).toBeInTheDocument();

    // Wait for the real API calls to complete via MSW
    expect(await screen.findByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("should show create role modal when clicking create role button and submit", async () => {
    const { user } = renderPage(<RoleListPage />);

    expect(await screen.findByText("Admin")).toBeInTheDocument();

    const createBtn = screen.getByRole("button", { name: "Create role" });
    await user.click(createBtn);

    // Modal should be visible
    expect(screen.getByText("New role")).toBeInTheDocument();

    // Fill form
    const input = screen.getByPlaceholderText("Role name");
    await user.type(input, "New role");

    // Click submit, in the dialog: the page button has the same name
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create role",
      }),
    );

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("New role")).not.toBeInTheDocument();
    });
  });

  it("should render the RoleFormModal for editing when clicking edit button and submit", async () => {
    const { user } = renderPage(<RoleListPage />);

    expect(await screen.findByText("Admin")).toBeInTheDocument();

    // Click edit on the Admin role (first row)
    const editButtons = screen.getAllByTitle("Edit role");
    await user.click(editButtons[0]);

    // Modal should be visible
    expect(screen.getByText("Edit a Role")).toBeInTheDocument();

    // Modify the role name
    const input = screen.getByPlaceholderText("Role name");
    await user.clear(input);
    await user.type(input, "Admin edited");

    // Click submit inside the modal
    const editRoleButtons = screen.getAllByRole("button", {
      name: /edit role/i,
    });
    await user.click(editRoleButtons[editRoleButtons.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Edit a Role")).not.toBeInTheDocument();
    });
  });

  it("should handle delete confirmation", async () => {
    const { user } = renderPage(<RoleListPage />);

    expect(await screen.findByText("User")).toBeInTheDocument();

    // Click delete on the User role (second row)
    const deleteButtons = screen.getAllByTitle("Delete role");
    await user.click(deleteButtons[1]);

    // Delete confirmation modal should be visible
    const dialog = screen.getByRole("dialog", { name: "Delete role" });

    // Confirm with the action button
    await user.click(
      within(dialog).getByRole("button", { name: "Delete role" }),
    );

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("displays empty list when API returns no roles", async () => {
    server.use(
      http.get("*/v1/roles", () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    renderPage(<RoleListPage />);
    expect(
      screen.getByRole("heading", { name: "Roles list" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("User")).not.toBeInTheDocument();
  });

  it("shows a failed load of the roles in the table", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/v1/roles", () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Network/communication error." },
          { status: 500 },
        );
      }),
    );

    renderPage(<RoleListPage />);
    // In the table, with Retry, and not repeated in a toast (UX-23)
    const table = await screen.findByRole("table");
    expect(
      await within(table).findByText(SYSTEM_ERROR_MESSAGE),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(SYSTEM_ERROR_MESSAGE)).toHaveLength(1);
    consoleSpy.mockRestore();
  });
});
