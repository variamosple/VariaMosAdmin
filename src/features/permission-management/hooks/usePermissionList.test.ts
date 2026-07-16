import { renderHook, act } from "@testing-library/react";
import { usePermissionList } from "./usePermissionList";
import * as PermissionRepository from "../api/PermissionRepository";
import { Permission } from "../domain/Entity/Permission";
import { usePaginatedQuery } from "@variamosple/variamos-components";

// Mock the dependencies
jest.mock("../api/PermissionRepository");

const mockPushToast = jest.fn();
jest.mock("@/UI/Context/ToastContext", () => ({
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

describe("usePermissionList Hook", () => {
  const createPermissionMock = PermissionRepository.createPermission as jest.Mock;
  const updatePermissionMock = PermissionRepository.updatePermission as jest.Mock;
  const deletePermissionMock = PermissionRepository.deletePermission as jest.Mock;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoadData.mockResolvedValue({ data: [] });

    usePaginatedQueryMock.mockReturnValue({
      data: [{ id: 1, name: "read:users" }],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });
  });

  it("should initialize with expected values from query hook", () => {
    const { result } = renderHook(() => usePermissionList());

    expect(result.current.permissions).toEqual([{ id: 1, name: "read:users" }]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalPages).toBe(1);
  });

  it("should handle onPermissionCreate successfully", async () => {
    createPermissionMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => usePermissionList());

    let response;
    await act(async () => {
      response = await result.current.onPermissionCreate({ name: "write:roles" });
    });

    expect(createPermissionMock).toHaveBeenCalledWith({ name: "write:roles" });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Permission create", variant: "success" }),
    );
  });

  it("should handle onPermissionCreate error", async () => {
    createPermissionMock.mockResolvedValue({ errorCode: 500, message: "Create Failed" });
    const { result } = renderHook(() => usePermissionList());

    await act(async () => {
      await result.current.onPermissionCreate({ name: "write:roles" });
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission create",
        message: "Create Failed",
        variant: "danger",
      }),
    );
  });

  it("should handle performEditPermission successfully", async () => {
    updatePermissionMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => usePermissionList());

    await act(async () => {
      await result.current.performEditPermission({ id: 1, name: "read:users-edited" });
    });

    expect(updatePermissionMock).toHaveBeenCalledWith({ id: 1, name: "read:users-edited" });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Permission edit", variant: "success" }),
    );
  });

  it("should handle performDeletePermission successfully", async () => {
    deletePermissionMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => usePermissionList());

    await act(async () => {
      await result.current.performDeletePermission({ id: 1, name: "read:users" });
    });

    expect(deletePermissionMock).toHaveBeenCalledWith(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission delete",
        message: "Permission deleted successfully",
      }),
    );
  });
});
