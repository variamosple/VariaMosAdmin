import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { ToastProvider } from "@/shared/context/ToastContext";
import { LanguageListPage } from "./index";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  const React = await import("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: <T,>(component: T): T => component,
    PagedModel: class PagedModel {},
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
    usePaginatedQuery: <T, F>({
      queryFunction,
      initialFilter,
    }: {
      queryFunction: (filter: F) => Promise<{
        errorCode?: number;
        message?: string;
        data?: T[];
        type: string;
      }>;
      initialFilter: F;
    }) => {
      const [data, setData] = useState<T[]>([]);
      const [currentPage, setCurrentPage] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [isLoading, setIsLoading] = useState(false);

      const loadData = useCallback(
        async (filter: F) => {
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
vi.mock(
  "@variamosple/variamos-components/dist/Components/ConfirmationModal",
  async () => {
    return {
      __esModule: true,
      default: ({
        show,
        message,
        onConfirm,
        onCancel,
      }: {
        show: boolean;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
      }) => {
        if (!show) return null;
        return (
          <div data-testid="confirm-modal">
            <span>{message}</span>
            <button type="button" onClick={onConfirm}>
              Confirm
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        );
      },
    };
  },
);

describe("LanguageListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    // Click edit on the English language row
    const englishRow = screen.getByRole("row", { name: /English/ });
    const editButton = within(englishRow).getByTitle("Edit language");
    await user.click(editButton);

    // Modal should be visible
    expect(screen.getByText(/edit a language/i)).toBeInTheDocument();

    // Modify the language name in input
    const input = screen.getByPlaceholderText("Language name");
    await user.clear(input);
    await user.type(input, "English US");

    // Click submit inside the modal
    const editLangButtons = screen.getAllByRole("button", {
      name: /edit language/i,
    });
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

    // Click delete on the Spanish language row
    const spanishRow = screen.getByRole("row", { name: /Spanish/ });
    const deleteButton = within(spanishRow).getByTitle("Delete language");
    await user.click(deleteButton);

    // Delete confirmation modal should be visible
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete the language?"),
    ).toBeInTheDocument();

    // Click confirm delete
    await user.click(screen.getByText("Confirm"));

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    });
  });

  it("shows and handles ConfirmationModal for activating a language", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageListPage />);

    expect(await screen.findByText("Spanish")).toBeInTheDocument();

    // Click activate on the Spanish language row (which is PENDING)
    const spanishRow = screen.getByRole("row", { name: /Spanish/ });
    const activateButton = within(spanishRow).getByTitle("Activate language");
    await user.click(activateButton);

    // Confirmation modal should be visible
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to activate the language 'Spanish'?",
      ),
    ).toBeInTheDocument();

    // Click confirm
    await user.click(screen.getByText("Confirm"));

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    });
  });

  it("shows and handles ConfirmationModal for deactivating a language", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageListPage />);

    expect(await screen.findByText("English")).toBeInTheDocument();

    // Click deactivate on the English language row (which is ACTIVE)
    const englishRow = screen.getByRole("row", { name: /English/ });
    const deactivateButton = within(englishRow).getByTitle(
      "Deactivate language",
    );
    await user.click(deactivateButton);

    // Confirmation modal should be visible
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to deactivate the language 'English'?",
      ),
    ).toBeInTheDocument();

    // Click confirm
    await user.click(screen.getByText("Confirm"));

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    });
  });
});
