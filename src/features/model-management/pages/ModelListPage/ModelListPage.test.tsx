import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelListPage } from "./index";
import { ToastProvider } from "@/shared/context/ToastContext";

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

describe("ModelListPage Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("renders page components correctly", async () => {
    renderWithProviders(<ModelListPage />);
    expect(screen.getByText("Models list")).toBeInTheDocument();

    // Wait for the MSW handlers to return models
    expect(await screen.findByText("Model One")).toBeInTheDocument();
    expect(screen.getByText("Model Two")).toBeInTheDocument();
  });

  it("shows and handles ModelFormModal for editing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModelListPage />);

    expect(await screen.findByText("Model One")).toBeInTheDocument();

    // Click edit on the first model
    const editButtons = screen.getAllByTitle("Edit model");
    await user.click(editButtons[0]);

    // Modal should be visible
    expect(screen.getByText("Edit a Model")).toBeInTheDocument();

    // Modify model name
    const input = screen.getByPlaceholderText("Model name");
    await user.clear(input);
    await user.type(input, "Model One Edited");

    // Click submit inside the modal
    const editModelButtons = screen.getAllByRole("button", { name: /edit model/i });
    await user.click(editModelButtons[editModelButtons.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Edit a Model")).not.toBeInTheDocument();
    });
  });
});
