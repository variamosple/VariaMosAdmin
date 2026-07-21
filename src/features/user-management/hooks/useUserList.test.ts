import { renderHook, act } from "@testing-library/react";
import { useUserList } from "./useUserList";
import { User } from "../domain/Entity/User";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

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

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("useUserList Hook", () => {
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  const dummyUser: User = {
    id: "123",
    user: "john_doe",
    name: "John Doe",
    email: "john@example.com",
    isEnabled: true,
    isDeleted: false,
    createdAt: new Date(),
  };

  let disableUserCalled = 0;
  let enableUserCalled = 0;
  let deleteUserCalled = 0;
  let disableUserError = false;

  beforeEach(() => {
    jest.clearAllMocks();
    disableUserCalled = 0;
    enableUserCalled = 0;
    deleteUserCalled = 0;
    disableUserError = false;

    mockLoadData.mockResolvedValue({ errorCode: null });

    usePaginatedQueryMock.mockReturnValue({
      data: [dummyUser],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });

    server.use(
      http.put(apiTarget("/v1/users/:userId/disable"), () => {
        disableUserCalled++;
        if (disableUserError) {
          return HttpResponse.json({ errorCode: 500, message: "Disable failed" }, { status: 500 });
        }
        return HttpResponse.json({ errorCode: null });
      }),
      http.put(apiTarget("/v1/users/:userId/enable"), () => {
        enableUserCalled++;
        return HttpResponse.json({ errorCode: null });
      }),
      http.delete(apiTarget("/v1/users/:userId"), () => {
        deleteUserCalled++;
        return HttpResponse.json({ errorCode: null });
      }),
    );
  });

  it("should initialize with expected values and load user list on mount", () => {
    const { result } = renderHook(() => useUserList());

    expect(result.current.users).toEqual([dummyUser]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalPages).toBe(1);
    expect(mockLoadData).toHaveBeenCalled();
  });

  it("should handle onUserResetLink", () => {
    const { result } = renderHook(() => useUserList());

    act(() => {
      result.current.onUserResetLink(dummyUser);
    });

    expect(result.current.selectedUser).toEqual(dummyUser);
    expect(result.current.showResetLink).toBe(true);
  });

  it("should handle performDisableUser successfully", async () => {
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      await result.current.performDisableUser(dummyUser);
    });

    expect(disableUserCalled).toBe(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(result.current.showDisable).toBe(false);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "User disable",
        message: "User disabled successfully",
        variant: "success",
      }),
    );
  });

  it("should handle performDisableUser error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    disableUserError = true;
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      await result.current.performDisableUser(dummyUser);
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "User disable",
        message: "Disable failed",
        variant: "danger",
      }),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should handle performEnableUser successfully", async () => {
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      await result.current.performEnableUser(dummyUser);
    });

    expect(enableUserCalled).toBe(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(result.current.showEnable).toBe(false);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "User enable",
        message: "User enabled successfully",
        variant: "success",
      }),
    );
  });

  it("should handle performDeleteUser successfully", async () => {
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      await result.current.performDeleteUser(dummyUser);
    });

    expect(deleteUserCalled).toBe(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(result.current.showDelete).toBe(false);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "User delete",
        message: "User deleted successfully",
        variant: "success",
      }),
    );
  });

  it("should trigger loadData on search submit", async () => {
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      result.current.onSearchSubmit("john");
    });

    expect(mockLoadData).toHaveBeenLastCalledWith(expect.objectContaining({ search: "john" }));
  });

  it("should trigger loadData on search reset", async () => {
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      result.current.onSearchReset();
    });

    expect(mockLoadData).toHaveBeenLastCalledWith(expect.objectContaining({ search: undefined }));
  });
});
