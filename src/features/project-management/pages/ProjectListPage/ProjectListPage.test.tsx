import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectListPage } from "./index";
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

// Mock ConfirmationModal from @variamosple/variamos-components/dist/Components/ConfirmationModal
jest.mock("@variamosple/variamos-components/dist/Components/ConfirmationModal", () => {
  return {
    __esModule: true,
    default: ({ show, message, onConfirm, onCancel }: any) => {
      if (!show) return null;
      return (
        <div data-testid="delete-confirm-modal">
          <span>{message}</span>
          <button onClick={onConfirm}>Confirm Delete</button>
          <button onClick={onCancel}>Cancel Delete</button>
        </div>
      );
    },
  };
});

describe("ProjectListPage Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("renders page components correctly", async () => {
    renderWithProviders(<ProjectListPage />);
    expect(screen.getByText("Projects list")).toBeInTheDocument();

    // Wait for the MSW handlers to return projects
    expect(await screen.findByText("Project One")).toBeInTheDocument();
    expect(screen.getByText("Project Two")).toBeInTheDocument();
  });

  it("shows and handles ProjectFormModal for editing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectListPage />);

    expect(await screen.findByText("Project One")).toBeInTheDocument();

    // Click edit on the first project
    const editButtons = screen.getAllByTitle("Edit project");
    await user.click(editButtons[0]);

    // Modal should be visible
    expect(screen.getByText("Edit a Project")).toBeInTheDocument();

    // Modify project name
    const inputs = screen.getAllByPlaceholderText("Project name");
    const input = inputs[inputs.length - 1];
    await user.clear(input);
    await user.type(input, "Project One Edited");

    // Click submit inside the modal
    const editProjectButtons = screen.getAllByRole("button", { name: /edit project/i });
    await user.click(editProjectButtons[editProjectButtons.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Edit a Project")).not.toBeInTheDocument();
    });
  });

  it("shows and handles ConfirmationModal for deleting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectListPage />);

    expect(await screen.findByText("Project Two")).toBeInTheDocument();

    // Click delete on the second project
    const deleteButtons = screen.getAllByTitle("Delete project");
    await user.click(deleteButtons[1]);

    // Delete confirmation modal should be visible
    expect(screen.getByTestId("delete-confirm-modal")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete the project?")).toBeInTheDocument();

    // Click confirm delete
    await user.click(screen.getByText("Confirm Delete"));

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByTestId("delete-confirm-modal")).not.toBeInTheDocument();
    });
  });

  it("displays empty list when API returns no projects", async () => {
    server.use(
      http.get("*/v1/projects", () => {
        return HttpResponse.json({ data: [] });
      }),
      http.get("*/v1/admin/projects", () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    renderWithProviders(<ProjectListPage />);
    expect(screen.getByText("Projects list")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Project One")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Project Two")).not.toBeInTheDocument();
  });

  it("shows error toast when API fails to load projects", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/v1/projects", () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Network/communication error." },
          { status: 500 },
        );
      }),
      http.get("*/v1/admin/projects", () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Network/communication error." },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<ProjectListPage />);
    expect(await screen.findByText("Project query error")).toBeInTheDocument();
    expect(screen.getByText("Network/communication error.")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
