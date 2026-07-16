import { renderHook, act } from "@testing-library/react";
import { useUserList } from "./useUserList";
import * as UserRepository from "../api/UserRepository";
import { User } from "../domain/Entity/User";
import { usePaginatedQuery } from "@variamosple/variamos-components";

// Mock the dependencies
jest.mock("../api/UserRepository");

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

describe("useUserList Hook", () => {
  const disableUserMock = UserRepository.disableUser as jest.Mock;
  const enableUserMock = UserRepository.enableUser as jest.Mock;
  const deleteUserMock = UserRepository.deleteUser as jest.Mock;
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

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoadData.mockResolvedValue({ errorCode: null });

    usePaginatedQueryMock.mockReturnValue({
      data: [dummyUser],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });
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
    disableUserMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      await result.current.performDisableUser(dummyUser);
    });

    expect(disableUserMock).toHaveBeenCalledWith("123");
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
    disableUserMock.mockResolvedValue({ errorCode: 500, message: "Disable failed" });
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
  });

  it("should handle performEnableUser successfully", async () => {
    enableUserMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      await result.current.performEnableUser(dummyUser);
    });

    expect(enableUserMock).toHaveBeenCalledWith("123");
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
    deleteUserMock.mockResolvedValue({ errorCode: null });
    const { result } = renderHook(() => useUserList());

    await act(async () => {
      await result.current.performDeleteUser(dummyUser);
    });

    expect(deleteUserMock).toHaveBeenCalledWith("123");
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
