import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageListPage } from "./index";
import { ToastProvider } from "@/shared/context/ToastContext";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
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

describe("LanguageListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("renders page components correctly", async () => {
    renderWithProviders(<LanguageListPage />);
    expect(screen.getByText("Languages list")).toBeInTheDocument();

    // Wait for the MSW handlers to return English and Spanish
    expect(await screen.findByText("English")).toBeInTheDocument();
    expect(screen.getByText("Spanish")).toBeInTheDocument();
  });

  it("shows and handles LanguageFormModal for editing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageListPage />);

    expect(await screen.findByText("English")).toBeInTheDocument();

    // Click edit on the English language (first row)
    const editButtons = screen.getAllByTitle("Edit language");
    await user.click(editButtons[0]);

    // Modal should be visible
    expect(screen.getByText(/edit a language/i)).toBeInTheDocument();

    // Modify the language name in input
    const input = screen.getByPlaceholderText("Language name");
    await user.clear(input);
    await user.type(input, "English US");

    // Click submit inside the modal
    const editLangButtons = screen.getAllByRole("button", { name: /edit language/i });
    await user.click(editLangButtons[editLangButtons.length - 1]);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText(/edit a language/i)).not.toBeInTheDocument();
    });
  });

  it("shows and handles ConfirmationModal for deleting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageListPage />);

    expect(await screen.findByText("Spanish")).toBeInTheDocument();

    // Click delete on the Spanish language (second row)
    const deleteButtons = screen.getAllByTitle("Delete language");
    await user.click(deleteButtons[1]);

    // Delete confirmation modal should be visible
    expect(screen.getByTestId("delete-confirm-modal")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete the language?")).toBeInTheDocument();

    // Click confirm delete
    await user.click(screen.getByText("Confirm Delete"));

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByTestId("delete-confirm-modal")).not.toBeInTheDocument();
    });
  });
});
