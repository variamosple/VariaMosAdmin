import { renderHook, act, waitFor } from "@testing-library/react";
import { useModelList } from "./useModelList";
import * as ModelRepository from "../api/ModelRepository";
import { usePaginatedQuery } from "@variamosple/variamos-components";

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

describe("useModelList Hook", () => {
  let updateModelSpy: import('vitest').MockInstance;
  let deleteModelSpy: import('vitest').MockInstance;
  const usePaginatedQueryMock = usePaginatedQuery as import('vitest').Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    updateModelSpy = jest
      .spyOn(ModelRepository, "updateModel")
      .mockResolvedValue({ errorCode: null } as any);
    deleteModelSpy = jest
      .spyOn(ModelRepository, "deleteModel")
      .mockResolvedValue({ errorCode: null } as any);

    mockLoadData.mockResolvedValue({ data: [] });

    usePaginatedQueryMock.mockReturnValue({
      data: [{ id: "1", projectId: "p1", name: "Model One" }],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });
  });

  afterEach(() => {
    updateModelSpy.mockRestore();
    deleteModelSpy.mockRestore();
  });

  it("should initialize with values from query hook", () => {
    const { result } = renderHook(() => useModelList());

    expect(result.current.models).toEqual([{ id: "1", projectId: "p1", name: "Model One" }]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle performEditModel successfully", async () => {
    const { result } = renderHook(() => useModelList());

    await act(async () => {
      await result.current.performEditModel({ id: "1", projectId: "p1", name: "Model One Edited" });
    });

    expect(updateModelSpy).toHaveBeenCalledWith({
      id: "1",
      projectId: "p1",
      name: "Model One Edited",
    });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Model edit", variant: "success" }),
    );
  });

  it("should handle performDeleteModel successfully", async () => {
    const { result } = renderHook(() => useModelList());

    await act(async () => {
      await result.current.performDeleteModel({ id: "1", projectId: "p1", name: "Model One" });
    });

    expect(deleteModelSpy).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Model delete", message: "Model deleted successfully" }),
    );
  });

  it("should handle performEditModel failure", async () => {
    const { result } = renderHook(() => useModelList());
    updateModelSpy.mockResolvedValueOnce({ errorCode: 500, message: "Edit failed" } as any);

    await act(async () => {
      await result.current.performEditModel({ id: "1", projectId: "p1", name: "Model One Edited" });
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Model edit",
        message: "Edit failed",
        variant: "danger",
      }),
    );
    expect(result.current.isEditing).toBe(false);
  });

  it("should handle query error toast on loadData", async () => {
    mockLoadData.mockResolvedValueOnce({ errorCode: 500, message: "Query failed" });
    renderHook(() => useModelList());

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Model query error",
          message: "Query failed",
          variant: "danger",
        }),
      );
    });
  });
});
