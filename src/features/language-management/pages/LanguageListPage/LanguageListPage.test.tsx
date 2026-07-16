import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageListPage } from "./index";
import { useLanguageList } from "../../hooks/useLanguageList";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  return {
    withPageVisit: (component: any) => component,
    PagedModel: class PagedModel {},
    ResponseModel: class ResponseModel {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
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

// Mock hooks
jest.mock("../../hooks/useLanguageList");

// Mock sub-components
jest.mock("../../components/LanguageFormModal", () => ({
  LanguageFormModal: ({ showModal, onClose, onLanguageSubmit, defaultValue }: any) => {
    if (!showModal) return null;
    return (
      <div data-testid="language-form-modal">
        <span>Edit Modal</span>
        <button onClick={() => onLanguageSubmit(defaultValue)}>Submit Form</button>
        <button onClick={onClose}>Close Form</button>
      </div>
    );
  },
}));

jest.mock("../../components/LanguageSearchForm", () => ({
  LanguageSearchForm: () => <div data-testid="search-form">Search Form</div>,
}));

jest.mock("../../components/LanguageList", () => ({
  LanguageList: () => <div data-testid="languages-list">Languages List</div>,
}));

describe("LanguageListPage", () => {
  const mockPerformEdit = jest.fn();
  const mockPerformDelete = jest.fn();
  const mockSetShowEdit = jest.fn();
  const mockSetShowDelete = jest.fn();
  const mockSetToDelete = jest.fn();

  const baseHookState = {
    languages: [],
    totalPages: 1,
    currentPage: 1,
    isLoading: false,
    onPageChange: jest.fn(),
    onSearchReset: jest.fn(),
    onSearchSubmit: jest.fn(),
    onLanguageEdit: jest.fn(),
    toEditLanguage: null,
    showEdit: false,
    setShowEdit: mockSetShowEdit,
    performEditLanguage: mockPerformEdit,
    isEditing: false,
    onLanguageDelete: jest.fn(),
    toDeleteLanguage: null,
    setToDeleteLanguage: mockSetToDelete,
    showDelete: false,
    setShowDelete: mockSetShowDelete,
    performDeleteLanguage: mockPerformDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders page components correctly", () => {
    (useLanguageList as jest.Mock).mockReturnValue(baseHookState);
    render(<LanguageListPage />);
    expect(screen.getByText("Languages list")).toBeDefined();
    expect(screen.getByTestId("search-form")).toBeDefined();
    expect(screen.getByTestId("languages-list")).toBeDefined();
  });

  it("shows and handles LanguageFormModal for editing", () => {
    (useLanguageList as jest.Mock).mockReturnValue({
      ...baseHookState,
      showEdit: true,
      toEditLanguage: { id: 42, name: "JSON" },
    });

    render(<LanguageListPage />);
    expect(screen.getByTestId("language-form-modal")).toBeDefined();

    // Trigger Form Submit
    fireEvent.click(screen.getByText("Submit Form"));
    expect(mockPerformEdit).toHaveBeenCalledWith({ id: 42, name: "JSON" });

    // Trigger Close Form
    fireEvent.click(screen.getByText("Close Form"));
    expect(mockSetShowEdit).toHaveBeenCalledWith(false);
  });

  it("shows and handles ConfirmationModal for deleting", () => {
    (useLanguageList as jest.Mock).mockReturnValue({
      ...baseHookState,
      showDelete: true,
      toDeleteLanguage: { id: 99, name: "XML" },
    });

    render(<LanguageListPage />);
    expect(screen.getByTestId("delete-confirm-modal")).toBeDefined();

    // Confirm Delete
    fireEvent.click(screen.getByText("Confirm Delete"));
    expect(mockPerformDelete).toHaveBeenCalledWith({ id: 99, name: "XML" });
    expect(mockSetShowDelete).toHaveBeenCalledWith(false);

    // Cancel Delete
    fireEvent.click(screen.getByText("Cancel Delete"));
    expect(mockSetToDelete).toHaveBeenCalledWith(undefined);
    expect(mockSetShowDelete).toHaveBeenCalledWith(false);
  });
});
