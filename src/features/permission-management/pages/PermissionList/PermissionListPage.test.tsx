import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PermissionListPage } from "./index";
import { ToastProvider } from "@/shared/context/ToastContext";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";

// Mock @variamosple/variamos-components to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  const React = require("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: (component: any) => component,
    PagedModel: class PagedModel {},
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
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
    usePaginatedQuery: ({ queryFunction, initialFilter }: any) => {
      const [data, setData] = useState([]);
      const [currentPage, setCurrentPage] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [isLoading, setIsLoading] = useState(false);

      const loadData = useCallback(
        async (filter: any) => {
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
    jest.clearAllMocks();

    server.use(
      http.post("*/v1/permissions", () => {
        return HttpResponse.json({ data: { id: 3, name: "NEW_PERM" } });
      }),
      http.put("*/v1/permissions/:id", () => {
        return HttpResponse.json({ data: { id: 1, name: "READ_PRIVILEGES_EDITED" } });
      }),
      http.delete("*/v1/permissions/:id", () => {
        return HttpResponse.json({ data: null });
      }),
    );
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("should render list title, search form, and permission list", async () => {
    renderWithProviders(<PermissionListPage />);

    expect(screen.getByText("Permissions list")).toBeInTheDocument();

    // Wait for real MSW response to load permissions
    expect(await screen.findByText("READ_PRIVILEGES")).toBeInTheDocument();
    expect(screen.getByText("WRITE_PRIVILEGES")).toBeInTheDocument();
  });

  it("should show create modal when create button is clicked and submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PermissionListPage />);
    expect(await screen.findByText("READ_PRIVILEGES")).toBeInTheDocument();

    const createBtn = screen.getByRole("button", { name: /create permission/i });
    await user.click(createBtn);

    // Modal should be visible
    expect(screen.getByText("Create a Permission")).toBeInTheDocument();

    // Fill form
    const input = screen.getByPlaceholderText("Permission name");
    await user.type(input, "NEW_PERM");

    // Click submit
    const submitBtns = screen.getAllByRole("button", { name: "Create Permission" });
    await user.click(submitBtns[submitBtns.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Create a Permission")).not.toBeInTheDocument();
    });
  });

  it("should display edit modal when clicking edit button and submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PermissionListPage />);
    expect(await screen.findByText("READ_PRIVILEGES")).toBeInTheDocument();

    // Click edit on the first permission row
    const editButtons = screen.getAllByTitle("Edit permission");
    await user.click(editButtons[0]);

    // Modal should be visible
    expect(screen.getByText("Edit a Permission")).toBeInTheDocument();

    // Modify permission name
    const input = screen.getByPlaceholderText("Permission name");
    await user.clear(input);
    await user.type(input, "READ_PRIVILEGES_EDITED");

    // Click submit inside the modal
    const editRoleButtons = screen.getAllByRole("button", { name: /edit permission/i });
    await user.click(editRoleButtons[editRoleButtons.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Edit a Permission")).not.toBeInTheDocument();
    });
  });

  it("should handle delete confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PermissionListPage />);
    expect(await screen.findByText("WRITE_PRIVILEGES")).toBeInTheDocument();

    // Click delete on the second permission row
    const deleteButtons = screen.getAllByTitle("Delete permission");
    await user.click(deleteButtons[1]);

    // Confirmation modal should be visible
    expect(screen.getByText("Are you sure you want to delete the permission?")).toBeInTheDocument();

    // Click Accept to confirm
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Verify modal closes
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to delete the permission?"),
      ).not.toBeInTheDocument();
    });
  });

  it("displays empty list when API returns no permissions", async () => {
    server.use(
      http.get("*/v1/permissions", () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    renderWithProviders(<PermissionListPage />);
    expect(screen.getByRole("heading", { name: "Permissions list" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("READ_PRIVILEGES")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("WRITE_PRIVILEGES")).not.toBeInTheDocument();
  });

  it("shows error toast when API fails to load permissions", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/v1/permissions", () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Network/communication error." },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<PermissionListPage />);
    expect(await screen.findByText("Permission query error")).toBeInTheDocument();
    expect(screen.getByText("Network/communication error.")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
