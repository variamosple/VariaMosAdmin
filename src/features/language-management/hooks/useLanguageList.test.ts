import { act, renderHook, waitFor } from "@testing-library/react";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import * as LanguageRepository from "../api/LanguageRepository";
import { useLanguageList } from "./useLanguageList";

const mockPushToast = vi.fn();
vi.mock("@/shared/context/ToastContext", async () => ({
  useToast: () => ({
    pushToast: mockPushToast,
  }),
}));

const mockLoadData = vi.fn();
const mockOnPageChange = vi.fn();

vi.mock("@variamosple/variamos-components", async () => {
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
    usePaginatedQuery: vi.fn(),
  };
});

describe("useLanguageList Hook", () => {
  let updateLanguageSpy: import("vitest").MockInstance;
  let deleteLanguageSpy: import("vitest").MockInstance;
  const usePaginatedQueryMock = usePaginatedQuery as import("vitest").Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    updateLanguageSpy = vi
      .spyOn(LanguageRepository, "updateLanguage")
      .mockResolvedValue({ errorCode: null } as any);
    deleteLanguageSpy = vi
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

  it("should handle performEditLanguage failure", async () => {
    const { result } = renderHook(() => useLanguageList());
    updateLanguageSpy.mockResolvedValueOnce({
      errorCode: 500,
      message: "Edit failed",
    } as any);

    await act(async () => {
      await result.current.performEditLanguage({
        id: 1,
        name: "Language One Edited",
        stateAccept: "ACTIVE",
      });
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Language edit",
        message: "Edit failed",
        variant: "danger",
      }),
    );
    expect(result.current.isEditing).toBe(false);
  });

  it("should handle query error toast on loadData", async () => {
    mockLoadData.mockResolvedValueOnce({
      errorCode: 500,
      message: "Query failed",
    });
    renderHook(() => useLanguageList());

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Language query error",
          message: "Query failed",
          variant: "danger",
        }),
      );
    });
  });
});
