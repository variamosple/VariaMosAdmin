import { renderHook, act } from "@testing-library/react";
import { useLanguageList } from "./useLanguageList";
import * as LanguageRepository from "../api/LanguageRepository";
import { usePaginatedQuery } from "@variamosple/variamos-components";

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
  let updateLanguageSpy: jest.SpyInstance;
  let deleteLanguageSpy: jest.SpyInstance;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    updateLanguageSpy = jest
      .spyOn(LanguageRepository, "updateLanguage")
      .mockResolvedValue({ errorCode: null } as any);
    deleteLanguageSpy = jest
      .spyOn(LanguageRepository, "deleteLanguage")
      .mockResolvedValue({ errorCode: null } as any);

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

  afterEach(() => {
    updateLanguageSpy.mockRestore();
    deleteLanguageSpy.mockRestore();
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
    const { result } = renderHook(() => useLanguageList());

    await act(async () => {
      await result.current.performEditLanguage({
        id: 1,
        name: "Language One Edited",
        stateAccept: "ACTIVE",
      });
    });

    expect(updateLanguageSpy).toHaveBeenCalledWith({
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
    const { result } = renderHook(() => useLanguageList());

    await act(async () => {
      await result.current.performDeleteLanguage({
        id: 1,
        name: "Language One",
        stateAccept: "ACTIVE",
      });
    });

    expect(deleteLanguageSpy).toHaveBeenCalledWith(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Language delete",
        message: "Language deleted successfully",
      }),
    );
  });
});
