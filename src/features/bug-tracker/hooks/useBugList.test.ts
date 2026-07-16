import { renderHook, act, waitFor } from "@testing-library/react";
import { useBugList } from "./useBugList";
import * as BugRepository from "../api/BugRepository";
import { Bug } from "../domain/Bug";

// Mock the variamos-components library which is published as ES Module
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
  };
});

// Mock the BugRepository module
jest.mock("../api/BugRepository");

const mockBugsList: Bug[] = [
  {
    id: "1",
    title: "Bug One",
    description: "First bug description",
    priority: "high",
    category: "frontend",
    status: "open",
  },
  {
    id: "2",
    title: "Bug Two",
    description: "Second bug description",
    priority: "low",
    category: "backend",
    status: "open",
  },
];

describe("useBugList Hook", () => {
  const queryBugsMock = BugRepository.queryBugs as jest.Mock;
  const queryLocalBugsMock = BugRepository.queryLocalBugs as jest.Mock;
  const queryBugReposMock = BugRepository.queryBugRepos as jest.Mock;
  const queryCategoriesMock = BugRepository.queryCategories as jest.Mock;
  const createBugMock = BugRepository.createBug as jest.Mock;
  const syncBugsMock = BugRepository.syncBugs as jest.Mock;
  const rejectLocalBugMock = BugRepository.rejectLocalBug as jest.Mock;
  const restoreLocalBugMock = BugRepository.restoreLocalBug as jest.Mock;
  const updateBugStatusMock = BugRepository.updateBugStatus as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock resolves
    queryBugReposMock.mockResolvedValue({ data: ["repo-a", "repo-b"] });
    queryCategoriesMock.mockResolvedValue({ data: ["cat-1", "cat-2"] });
    queryBugsMock.mockResolvedValue({ data: mockBugsList });
    queryLocalBugsMock.mockResolvedValue({ data: [] });
  });

  it("should initialize with default states and fetch repos, categories, and bugs on mount", async () => {
    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.bugs).toEqual(mockBugsList);
    expect(result.current.repos).toEqual(["repo-a", "repo-b"]);
    expect(result.current.categories).toEqual(["cat-1", "cat-2"]);
    expect(result.current.error).toBeNull();
    expect(result.current.activeTab).toBe("github");

    expect(queryBugReposMock).toHaveBeenCalledTimes(1);
    expect(queryCategoriesMock).toHaveBeenCalledTimes(1);
    expect(queryBugsMock).toHaveBeenCalledWith(result.current.filter);
  });

  it("should handle error during bug fetching gracefully", async () => {
    queryBugsMock.mockResolvedValue({ errorCode: 500, message: "Server Error" });

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.bugs).toEqual([]);
    expect(result.current.error).toBe("Server Error");
  });

  it("should fetch local bugs when changing activeTab to local", async () => {
    const mockLocalBugs = [
      {
        id: "local-1",
        title: "Local Bug",
        description: "Desc",
        priority: "medium",
        category: "frontend",
        status: "pending",
      },
    ] as Bug[];
    queryLocalBugsMock.mockResolvedValue({ data: mockLocalBugs });

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setActiveTab("local");
    });

    expect(result.current.activeTab).toBe("local");
    expect(queryLocalBugsMock).toHaveBeenCalledWith(expect.objectContaining({ status: "pending" }));
    expect(result.current.bugs).toEqual(mockLocalBugs);
  });

  it("should filter bugs when setFilter is called", async () => {
    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setFilter({
        repo: "repo-a",
        status: "open",
        priority: "high",
        search: "Bug One",
      });
    });

    expect(queryBugsMock).toHaveBeenLastCalledWith({
      repo: "repo-a",
      status: "open",
      priority: "high",
      search: "Bug One",
    });
  });

  it("should call createBug and refresh lists upon success", async () => {
    createBugMock.mockResolvedValue({ data: { id: "new-bug" } });

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsMock.mockClear();

    let createSuccess;
    await act(async () => {
      createSuccess = await result.current.handleCreateBug(
        "New Title",
        "New Desc",
        "high",
        "cat-1",
        "repo-a",
      );
    });

    expect(createSuccess).toBe(true);
    expect(createBugMock).toHaveBeenCalledWith(
      "New Title",
      "New Desc",
      "high",
      "cat-1",
      "repo-a",
      undefined,
    );
    expect(queryBugsMock).toHaveBeenCalledTimes(1); // Refresh call
  });

  it("should call rejectLocalBug and refresh lists", async () => {
    rejectLocalBugMock.mockResolvedValue({ data: { id: "1" } });

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsMock.mockClear();

    await act(async () => {
      await result.current.handleReject("1");
    });

    expect(rejectLocalBugMock).toHaveBeenCalledWith("1");
    expect(queryBugsMock).toHaveBeenCalledTimes(1);
  });

  it("should call restoreLocalBug and refresh lists", async () => {
    restoreLocalBugMock.mockResolvedValue({ data: { id: "1" } });

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsMock.mockClear();

    await act(async () => {
      await result.current.handleRestore("1");
    });

    expect(restoreLocalBugMock).toHaveBeenCalledWith("1");
    expect(queryBugsMock).toHaveBeenCalledTimes(1);
  });

  it("should call updateBugStatus during handleApprove and refresh lists", async () => {
    updateBugStatusMock.mockResolvedValue({ data: { id: "1" } });

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsMock.mockClear();

    await act(async () => {
      await result.current.handleApprove("1", "approved", "Good to go");
    });

    expect(updateBugStatusMock).toHaveBeenCalledWith(
      "1",
      "approved",
      "Good to go",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(queryBugsMock).toHaveBeenCalledTimes(1);
  });

  it("should call syncBugs and refresh bugs", async () => {
    syncBugsMock.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsMock.mockClear();

    await act(async () => {
      await result.current.handleSyncBugs();
    });

    expect(syncBugsMock).toHaveBeenCalledTimes(1);
    expect(queryBugsMock).toHaveBeenCalledTimes(1);
  });
});
