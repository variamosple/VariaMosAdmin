import { act, renderHook } from "@testing-library/react";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { usePermissionList } from "./usePermissionList";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

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

describe("usePermissionList Hook", () => {
  const usePaginatedQueryMock = usePaginatedQuery as import("vitest").Mock;

  beforeEach(() => {
    vi.clearAllMocks();

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
    let createPayload: Partial<Permission> | null = null;
    server.use(
      http.post(apiTarget("/v1/permissions"), async ({ request }) => {
        createPayload = (await request.json()) as Partial<Permission>;
        return HttpResponse.json({ errorCode: null });
      }),
    );

    const { result } = renderHook(() => usePermissionList());

    await act(async () => {
      await result.current.onPermissionCreate({ name: "write:roles" });
    });

    expect(createPayload).toEqual({ name: "write:roles" });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission create",
        variant: "success",
      }),
    );
  });

  it("should handle onPermissionCreate error", async () => {
    server.use(
      http.post(apiTarget("/v1/permissions"), () => {
        return HttpResponse.json({ errorCode: 500, message: "Create Failed" });
      }),
    );

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
    let editPayload: Permission | null = null;
    let editPermissionId: string | null = null;
    server.use(
      http.put(
        apiTarget("/v1/permissions/:id"),
        async ({ request, params }) => {
          editPermissionId = params.id as string;
          editPayload = (await request.json()) as Permission;
          return HttpResponse.json({ errorCode: null });
        },
      ),
    );

    const { result } = renderHook(() => usePermissionList());

    await act(async () => {
      await result.current.performEditPermission({
        id: 1,
        name: "read:users-edited",
      });
    });

    expect(editPermissionId).toBe("1");
    expect(editPayload).toEqual({ id: 1, name: "read:users-edited" });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Permission edit", variant: "success" }),
    );
  });

  it("should handle performDeletePermission successfully", async () => {
    let deletePermissionId: string | null = null;
    server.use(
      http.delete(apiTarget("/v1/permissions/:id"), ({ params }) => {
        deletePermissionId = params.id as string;
        return HttpResponse.json({ errorCode: null });
      }),
    );

    const { result } = renderHook(() => usePermissionList());

    await act(async () => {
      await result.current.performDeletePermission({
        id: 1,
        name: "read:users",
      });
    });

    expect(deletePermissionId).toBe("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission delete",
        message: "Permission deleted successfully",
      }),
    );
  });
});
