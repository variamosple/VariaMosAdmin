import { act, renderHook, waitFor } from "@testing-library/react";
import {
  type ResponseModel,
  usePaginatedQuery,
} from "@variamosple/variamos-components";
import type { Project } from "@/features/project-management/domain/Entity/Project";
import * as ProjectRepository from "../api/ProjectRepository";
import { useProjectList } from "./useProjectsList";

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

describe("useProjectList Hook", () => {
  let updateProjectSpy: import("vitest").MockInstance;
  let deleteProjectSpy: import("vitest").MockInstance;
  const usePaginatedQueryMock = usePaginatedQuery as import("vitest").Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    updateProjectSpy = vi
      .spyOn(ProjectRepository, "updateProject")
      .mockResolvedValue({ errorCode: undefined } as ResponseModel<Project>);
    deleteProjectSpy = vi
      .spyOn(ProjectRepository, "deleteProject")
      .mockResolvedValue({ errorCode: undefined } as ResponseModel<void>);

    mockLoadData.mockResolvedValue({ data: [] });

    usePaginatedQueryMock.mockReturnValue({
      data: [{ id: 1, name: "Project One", template: false }],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });
  });

  afterEach(() => {
    updateProjectSpy.mockRestore();
    deleteProjectSpy.mockRestore();
  });

  it("should initialize with values from query hook", () => {
    const { result } = renderHook(() => useProjectList());

    expect(result.current.projects).toEqual([
      { id: 1, name: "Project One", template: false },
    ]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle performEditProject successfully", async () => {
    const { result } = renderHook(() => useProjectList());

    await act(async () => {
      await result.current.performEditProject({
        id: "1",
        name: "Project One Edited",
      });
    });

    expect(updateProjectSpy).toHaveBeenCalledWith({
      id: "1",
      name: "Project One Edited",
    });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Project edit", variant: "success" }),
    );
  });

  it("should handle performDeleteProject successfully", async () => {
    const { result } = renderHook(() => useProjectList());

    await act(async () => {
      await result.current.performDeleteProject({
        id: "1",
        name: "Project One",
      });
    });

    expect(deleteProjectSpy).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Project delete",
        message: "Project deleted successfully",
      }),
    );
  });

  it("should handle performEditProject failure", async () => {
    const { result } = renderHook(() => useProjectList());
    updateProjectSpy.mockResolvedValueOnce({
      errorCode: 500,
      message: "Edit failed",
    } as ResponseModel<Project>);

    await act(async () => {
      await result.current.performEditProject({
        id: "1",
        name: "Project One Edited",
      });
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Project edit",
        message: "Edit failed",
        variant: "danger",
      }),
    );
    expect(result.current.isEditing).toBe(false);
  });

  it("should handle query error toast on loadData", async () => {
    mockLoadData.mockResolvedValueOnce({
      errorCode: 500,
      message: "Query failed",
    });
    renderHook(() => useProjectList());

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Project query error",
          message: "Query failed",
          variant: "danger",
        }),
      );
    });
  });
});
