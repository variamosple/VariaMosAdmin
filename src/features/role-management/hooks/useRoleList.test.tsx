import { act, renderHook, waitFor } from "@testing-library/react";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { useRoleList } from "./useRoleList";

const mockPushToast = vi.fn();
const mockRemoveToast = vi.fn();
vi.mock("@/shared/context/ToastContext", async () => ({
  useToast: () => ({
    pushToast: mockPushToast,
    removeToast: mockRemoveToast,
  }),
}));

const mockLoadData = vi.fn();
const mockOnPageChange = vi.fn();

vi.mock("@variamosple/variamos-components", async () => {
  return {
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

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("useRoleList Hook", () => {
  const usePaginatedQueryMock = usePaginatedQuery as import("vitest").Mock;

  let createRoleCalled = 0;
  let updateRoleCalled = 0;
  let deleteRoleCalled = 0;
  let createRolePayload: Partial<Role> | null = null;
  let updateRolePayload: Role | null = null;
  let deleteRoleId: number | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
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
    mockLoadData.mockResolvedValueOnce({
      errorCode: 500,
      message: "Query failed",
    });

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

  it("should handle performEditRole failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.put(apiTarget("/v1/roles/:roleId"), () => {
        return HttpResponse.json(
          { errorCode: "500", message: "Edit failed" },
          { status: 500 },
        );
      }),
    );

    const { result } = renderHook(() => useRoleList());

    await act(async () => {
      await result.current.performEditRole({ id: 1, name: "Admin Edit" });
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Role edit",
        message: "Edit failed",
        variant: "danger",
      }),
    );
    expect(result.current.isEditing).toBe(false);
    consoleSpy.mockRestore();
  });
});
