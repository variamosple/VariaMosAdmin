import { act, renderHook, waitFor } from "@testing-library/react";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";
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
        createRolePayload = (await request.json()) as Partial<Role>;
        // The server answers the role it created
        return HttpResponse.json({ data: { id: 30, ...createRolePayload } });
      }),
      http.put(apiTarget("/v1/roles/:roleId"), async ({ request }) => {
        updateRoleCalled++;
        updateRolePayload = (await request.json()) as Role;
        return HttpResponse.json({ data: updateRolePayload });
      }),
      http.delete(apiTarget("/v1/roles/:roleId"), ({ params }) => {
        deleteRoleCalled++;
        deleteRoleId = Number(params.roleId);
        return HttpResponse.json({ errorCode: null });
      }),
    );
  });

  it("should initialize with values from query hook", () => {
    const { result } = renderHook(() => useRoleList(), {
      wrapper: MemoryRouter,
    });

    expect(result.current.roles).toEqual([{ id: 1, name: "Admin" }]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("leaves a load error to the table, without a toast (UX-23)", async () => {
    mockLoadData.mockResolvedValueOnce({
      errorCode: 500,
      message: "Query failed",
    });
    renderHook(() => useRoleList(), { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(mockLoadData).toHaveBeenCalled();
    });
    expect(mockPushToast).not.toHaveBeenCalled();
  });

  it("should handle role creation successfully", async () => {
    const { result } = renderHook(() => useRoleList(), {
      wrapper: MemoryRouter,
    });

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
    const { result } = renderHook(() => useRoleList(), {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      await result.current.performEditRole({ id: 1, name: "Admin Edit" });
    });

    expect(updateRoleCalled).toBe(1);
    expect(updateRolePayload).toEqual({ id: 1, name: "Admin Edit" });
    expect(mockRemoveToast).toHaveBeenCalledWith("toast-123");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle performDeleteRole successfully", async () => {
    const { result } = renderHook(() => useRoleList(), {
      wrapper: MemoryRouter,
    });

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

    const { result } = renderHook(() => useRoleList(), {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      await result.current.performEditRole({ id: 1, name: "Admin Edit" });
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Role edit",
        message: SYSTEM_ERROR_MESSAGE,
        variant: "danger",
      }),
    );
    expect(result.current.isEditing).toBe(false);
    consoleSpy.mockRestore();
  });

  it("sorts by a column, turns its order on a second click, and keeps the search (EV-95)", () => {
    const state = (filter: object) => ({
      data: [],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
      filter: { name: "admin", pageNumber: 1, pageSize: 20, ...filter },
    });
    usePaginatedQueryMock.mockReturnValue(state({}));
    const { result, rerender } = renderHook(() => useRoleList(), {
      wrapper: MemoryRouter,
    });
    expect(result.current.sort).toEqual({ by: "name", order: "asc" });

    act(() => result.current.onSort("id"));
    expect(mockLoadData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "admin",
        sortBy: "id",
        sortOrder: undefined,
      }),
    );

    usePaginatedQueryMock.mockReturnValue(state({ sortBy: "id" }));
    rerender();
    act(() => result.current.onSort("id"));
    expect(mockLoadData).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: "id", sortOrder: "desc" }),
    );

    act(() => result.current.onSearchSubmit("other"));
    expect(mockLoadData).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "other", sortBy: "id" }),
    );

    act(() => result.current.onSearchReset());
    expect(mockLoadData).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: undefined, sortBy: "id" }),
    );
  });
});
