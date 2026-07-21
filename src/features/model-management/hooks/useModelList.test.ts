import { renderHook, act } from "@testing-library/react";
import { useModelList } from "./useModelList";
import * as ModelRepository from "../api/ModelRepository";
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

describe("useModelList Hook", () => {
  let updateModelSpy: jest.SpyInstance;
  let deleteModelSpy: jest.SpyInstance;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

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
});
