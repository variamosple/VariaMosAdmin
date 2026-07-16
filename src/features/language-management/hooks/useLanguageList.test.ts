import { renderHook, act } from "@testing-library/react";
import { useLanguageList } from "./useLanguageList";
import * as LanguageRepository from "../api/LanguageRepository";
import { usePaginatedQuery } from "@variamosple/variamos-components";

// Mock dependencies
jest.mock("../api/LanguageRepository");

const mockPushToast = jest.fn();
jest.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({
    pushToast: mockPushToast,
  }),
}));

const mockLoadData = jest.fn();
const mockOnPageChange = jest.fn();

jest.mock("@variamosple/variamos-components", () => {
  return {
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
    PagedModel: class PagedModel {
      pageNumber?: number;
      pageSize?: number;
      constructor(pageNumber?: number, pageSize?: number) {
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
      }
    },
    usePaginatedQuery: jest.fn(),
  };
});

describe("useLanguageList Hook", () => {
  const updateLanguageMock = LanguageRepository.updateLanguage as jest.Mock;
  const deleteLanguageMock = LanguageRepository.deleteLanguage as jest.Mock;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoadData.mockResolvedValue({ data: [] });

    usePaginatedQueryMock.mockReturnValue({
      data: [{ id: 1, name: "Language One", stateAccept: "ACTIVE" }],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });
  });

  it("should initialize with values from query hook", () => {
    const { result } = renderHook(() => useLanguageList());

    expect(result.current.languages).toEqual([
      { id: 1, name: "Language One", stateAccept: "ACTIVE" },
    ]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle performEditLanguage successfully", async () => {
    updateLanguageMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => useLanguageList());

    await act(async () => {
      await result.current.performEditLanguage({
        id: 1,
        name: "Language One Edited",
        stateAccept: "ACTIVE",
      });
    });

    expect(updateLanguageMock).toHaveBeenCalledWith({
      id: 1,
      name: "Language One Edited",
      stateAccept: "ACTIVE",
    });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Language edit", variant: "success" }),
    );
  });

  it("should handle performDeleteLanguage successfully", async () => {
    deleteLanguageMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => useLanguageList());

    await act(async () => {
      await result.current.performDeleteLanguage({
        id: 1,
        name: "Language One",
        stateAccept: "ACTIVE",
      });
    });

    expect(deleteLanguageMock).toHaveBeenCalledWith(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Language delete",
        message: "Language deleted successfully",
      }),
    );
  });
});
