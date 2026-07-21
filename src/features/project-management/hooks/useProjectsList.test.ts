import { renderHook, act } from "@testing-library/react";
import { useProjectList } from "./useProjectsList";
import * as ProjectRepository from "../api/ProjectRepository";
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

describe("useProjectList Hook", () => {
  let updateProjectSpy: jest.SpyInstance;
  let deleteProjectSpy: jest.SpyInstance;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    updateProjectSpy = jest
      .spyOn(ProjectRepository, "updateProject")
      .mockResolvedValue({ errorCode: null } as any);
    deleteProjectSpy = jest
      .spyOn(ProjectRepository, "deleteProject")
      .mockResolvedValue({ errorCode: null } as any);

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

    expect(result.current.projects).toEqual([{ id: 1, name: "Project One", template: false }]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle performEditProject successfully", async () => {
    const { result } = renderHook(() => useProjectList());

    await act(async () => {
      await result.current.performEditProject({ id: 1, name: "Project One Edited" });
    });

    expect(updateProjectSpy).toHaveBeenCalledWith({ id: 1, name: "Project One Edited" });
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Project edit", variant: "success" }),
    );
  });

  it("should handle performDeleteProject successfully", async () => {
    const { result } = renderHook(() => useProjectList());

    await act(async () => {
      await result.current.performDeleteProject({ id: 1, name: "Project One" });
    });

    expect(deleteProjectSpy).toHaveBeenCalledWith(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Project delete", message: "Project deleted successfully" }),
    );
  });
});
