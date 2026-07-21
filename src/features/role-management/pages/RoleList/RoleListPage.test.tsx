import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleListPage } from "./index";
import { ToastProvider } from "@/shared/context/ToastContext";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";

const mockNavigate = jest.fn();

// Mock @variamosple/variamos-components to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  const React = require("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: (component: any) => component,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
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

describe("RoleListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("should render page header, create button, and lists", async () => {
    renderWithProviders(<RoleListPage />);
    expect(screen.getByRole("heading", { name: "Roles list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Role" })).toBeInTheDocument();

    // Wait for the real API calls to complete via MSW
    expect(await screen.findByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("should show create role modal when clicking create role button and submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoleListPage />);

    expect(await screen.findByText("Admin")).toBeInTheDocument();

    const createBtn = screen.getByRole("button", { name: "Create Role" });
    await user.click(createBtn);

    // Modal should be visible
    expect(screen.getByText("Create a Role")).toBeInTheDocument();

    // Fill form
    const input = screen.getByPlaceholderText("Role name");
    await user.type(input, "NewRole");

    // Click submit
    await user.click(screen.getByRole("button", { name: "Create role" }));

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Create a Role")).not.toBeInTheDocument();
    });
  });

  it("should render the RoleFormModal for editing when clicking edit button and submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoleListPage />);

    expect(await screen.findByText("Admin")).toBeInTheDocument();

    // Click edit on the Admin role (first row)
    const editButtons = screen.getAllByTitle("Edit role");
    await user.click(editButtons[0]);

    // Modal should be visible
    expect(screen.getByText("Edit a Role")).toBeInTheDocument();

    // Modify the role name
    const input = screen.getByPlaceholderText("Role name");
    await user.clear(input);
    await user.type(input, "Admin Edited");

    // Click submit inside the modal
    const editRoleButtons = screen.getAllByRole("button", { name: /edit role/i });
    await user.click(editRoleButtons[editRoleButtons.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Edit a Role")).not.toBeInTheDocument();
    });
  });

  it("should handle delete confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoleListPage />);

    expect(await screen.findByText("User")).toBeInTheDocument();

    // Click delete on the User role (second row)
    const deleteButtons = screen.getAllByTitle("Delete role");
    await user.click(deleteButtons[1]);

    // Delete confirmation modal should be visible
    expect(screen.getByText("Are you sure you want to delete the role?")).toBeInTheDocument();

    // Click Accept to confirm delete
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Verify modal closes
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to delete the role?"),
      ).not.toBeInTheDocument();
    });
  });

  it("displays empty list when API returns no roles", async () => {
    server.use(
      http.get("*/v1/roles", () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    renderWithProviders(<RoleListPage />);
    expect(screen.getByRole("heading", { name: "Roles list" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("User")).not.toBeInTheDocument();
  });

  it("shows error toast when API fails to load roles", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/v1/roles", () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Network/communication error." },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<RoleListPage />);
    expect(await screen.findByText("Role query error")).toBeInTheDocument();
    expect(screen.getByText("Network/communication error.")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
