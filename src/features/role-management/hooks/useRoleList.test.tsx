import { renderHook, act, waitFor } from "@testing-library/react";
import { useRoleList } from "./useRoleList";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

const mockPushToast = jest.fn();
const mockRemoveToast = jest.fn();
jest.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({
    pushToast: mockPushToast,
    removeToast: mockRemoveToast,
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

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("useRoleList Hook", () => {
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  let createRoleCalled = 0;
  let updateRoleCalled = 0;
  let deleteRoleCalled = 0;
  let createRolePayload: any = null;
  let updateRolePayload: any = null;
  let deleteRoleId: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    createRoleCalled = 0;
    updateRoleCalled = 0;
    deleteRoleCalled = 0;
    createRolePayload = null;
    updateRolePayload = null;
    deleteRoleId = null;

    mockLoadData.mockResolvedValue({ data: [] });

    usePaginatedQueryMock.mockReturnValue({
      data: [{ id: 1, name: "Admin" }],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });

    server.use(
      http.post(apiTarget("/v1/roles"), async ({ request }) => {
        createRoleCalled++;
        createRolePayload = await request.json();
        return HttpResponse.json({ errorCode: null });
      }),
      http.put(apiTarget("/v1/roles/:roleId"), async ({ request }) => {
        updateRoleCalled++;
        updateRolePayload = await request.json();
        return HttpResponse.json({ errorCode: null });
      }),
      http.delete(apiTarget("/v1/roles/:roleId"), ({ params }) => {
        deleteRoleCalled++;
        deleteRoleId = Number(params.roleId);
        return HttpResponse.json({ errorCode: null });
      }),
    );
  });

  it("should initialize with values from query hook", () => {
    const { result } = renderHook(() => useRoleList());

    expect(result.current.roles).toEqual([{ id: 1, name: "Admin" }]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should load data on mount and handle query error toast", async () => {
    mockLoadData.mockResolvedValueOnce({ errorCode: 500, message: "Query failed" });

    renderHook(() => useRoleList());

    expect(mockLoadData).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Role query error",
          message: "Query failed",
          variant: "danger",
        }),
      );
    });
  });

  it("should handle role creation successfully", async () => {
    const { result } = renderHook(() => useRoleList());

    await act(async () => {
      await result.current.onRoleCreate({ name: "New Role" });
    });

    expect(createRoleCalled).toBe(1);
    expect(createRolePayload).toEqual({ name: "New Role" });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Role create",
        message: "Role created successfully",
        variant: "success",
      }),
    );
  });

  it("should handle performEditRole successfully", async () => {
    mockPushToast.mockReturnValue("toast-123");
    const { result } = renderHook(() => useRoleList());

    await act(async () => {
      await result.current.performEditRole({ id: 1, name: "Admin Edit" });
    });

    expect(updateRoleCalled).toBe(1);
    expect(updateRolePayload).toEqual({ id: 1, name: "Admin Edit" });
    expect(mockRemoveToast).toHaveBeenCalledWith("toast-123");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle performDeleteRole successfully", async () => {
    const { result } = renderHook(() => useRoleList());

    await act(async () => {
      await result.current.performDeleteRole({ id: 1, name: "Admin" });
    });

    expect(deleteRoleCalled).toBe(1);
    expect(deleteRoleId).toBe(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });
});
