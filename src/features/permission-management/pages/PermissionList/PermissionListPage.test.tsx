import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";
import { server } from "@/shared/tests/mocks/server";
import { renderPage } from "@/shared/tests/render";
import { PermissionListPage } from "./index";

// Mock @variamosple/variamos-components to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  const React = require("react") as typeof import("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: <T,>(component: T): T => component,
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

describe("PermissionListPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    server.use(
      http.post("*/v1/permissions", () => {
        return HttpResponse.json({ data: { id: 3, name: "reports::create" } });
      }),
      http.put("*/v1/permissions/:id", () => {
        return HttpResponse.json({
          data: { id: 1, name: "reports::read-all" },
        });
      }),
      http.delete("*/v1/permissions/:id", () => {
        return HttpResponse.json({ data: null });
      }),
    );
  });

  it("should render list title, search form, and permission list", async () => {
    renderPage(<PermissionListPage />);

    expect(screen.getByText("Permissions list")).toBeInTheDocument();

    // Wait for real MSW response to load permissions
    expect(await screen.findByText("READ_PRIVILEGES")).toBeInTheDocument();
    expect(screen.getByText("WRITE_PRIVILEGES")).toBeInTheDocument();
  });

  it("should show create modal when create button is clicked and submit", async () => {
    const { user } = renderPage(<PermissionListPage />);
    expect(await screen.findByText("READ_PRIVILEGES")).toBeInTheDocument();

    const createBtn = screen.getByRole("button", {
      name: /create permission/i,
    });
    await user.click(createBtn);

    // Modal should be visible
    expect(screen.getByText("New permission")).toBeInTheDocument();

    // Fill form
    const input = screen.getByPlaceholderText("Permission name");
    await user.type(input, "reports::create");

    // Click submit
    const submitBtns = screen.getAllByRole("button", {
      name: "Create permission",
    });
    await user.click(submitBtns[submitBtns.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("New permission")).not.toBeInTheDocument();
    });
  });

  it("should display edit modal when clicking edit button and submit", async () => {
    const { user } = renderPage(<PermissionListPage />);
    expect(await screen.findByText("READ_PRIVILEGES")).toBeInTheDocument();

    // Click edit on the first permission row
    const editButtons = screen.getAllByTitle("Edit permission");
    await user.click(editButtons[0]);

    // Modal should be visible
    expect(screen.getByText("Edit a Permission")).toBeInTheDocument();

    // Modify permission name
    const input = screen.getByPlaceholderText("Permission name");
    await user.clear(input);
    await user.type(input, "reports::read-all");

    // Click submit inside the modal
    const editRoleButtons = screen.getAllByRole("button", {
      name: /edit permission/i,
    });
    await user.click(editRoleButtons[editRoleButtons.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Edit a Permission")).not.toBeInTheDocument();
    });
  });

  it("should handle delete confirmation", async () => {
    const { user } = renderPage(<PermissionListPage />);
    expect(await screen.findByText("WRITE_PRIVILEGES")).toBeInTheDocument();

    // Click delete on the second permission row
    const deleteButtons = screen.getAllByTitle("Delete permission");
    await user.click(deleteButtons[1]);

    // Confirmation modal should be visible
    const dialog = screen.getByRole("dialog", { name: "Delete permission" });

    // Confirm with the action button
    await user.click(
      within(dialog).getByRole("button", { name: "Delete permission" }),
    );

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("displays empty list when API returns no permissions", async () => {
    server.use(
      http.get("*/v1/permissions", () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    renderPage(<PermissionListPage />);
    expect(
      screen.getByRole("heading", { name: "Permissions list" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("READ_PRIVILEGES")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("WRITE_PRIVILEGES")).not.toBeInTheDocument();
  });

  it("shows a failed load of the permissions in the table", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/v1/permissions", () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Network/communication error." },
          { status: 500 },
        );
      }),
    );

    renderPage(<PermissionListPage />);
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
