import { renderHook, act } from "@testing-library/react";
import { useModelList } from "./useModelList";
import * as ModelRepository from "../api/ModelRepository";
import { usePaginatedQuery } from "@variamosple/variamos-components";

// Mock dependencies
jest.mock("../api/ModelRepository");

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

describe("useModelList Hook", () => {
  const updateModelMock = ModelRepository.updateModel as jest.Mock;
  const deleteModelMock = ModelRepository.deleteModel as jest.Mock;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

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

  it("should initialize with values from query hook", () => {
    const { result } = renderHook(() => useModelList());

    expect(result.current.models).toEqual([{ id: "1", projectId: "p1", name: "Model One" }]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle performEditModel successfully", async () => {
    updateModelMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => useModelList());

    await act(async () => {
      await result.current.performEditModel({ id: "1", projectId: "p1", name: "Model One Edited" });
    });

    expect(updateModelMock).toHaveBeenCalledWith({
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
    deleteModelMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => useModelList());

    await act(async () => {
      await result.current.performDeleteModel({ id: "1", projectId: "p1", name: "Model One" });
    });

    expect(deleteModelMock).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Model delete", message: "Model deleted successfully" }),
    );
  });
});
