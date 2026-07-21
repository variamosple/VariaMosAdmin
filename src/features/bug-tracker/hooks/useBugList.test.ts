import { renderHook, act, waitFor } from "@testing-library/react";
import { useBugList } from "./useBugList";
import { Bug } from "../domain/Bug";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

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

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("useBugList Hook", () => {
  let queryBugsParams: any[] = [];
  let queryLocalBugsParams: any[] = [];
  let queryBugReposCalled = 0;
  let queryCategoriesCalled = 0;
  let createBugCalled = 0;
  let syncBugsCalled = 0;
  let rejectLocalBugId: string | null = null;
  let restoreLocalBugId: string | null = null;
  let updateBugStatusBody: any = null;

  beforeEach(() => {
    queryBugsParams = [];
    queryLocalBugsParams = [];
    queryBugReposCalled = 0;
    queryCategoriesCalled = 0;
    createBugCalled = 0;
    syncBugsCalled = 0;
    rejectLocalBugId = null;
    restoreLocalBugId = null;
    updateBugStatusBody = null;

    server.use(
      http.get(apiTarget("/bugs"), ({ request }) => {
        const url = new URL(request.url);
        queryBugsParams.push(Object.fromEntries(url.searchParams.entries()));
        return HttpResponse.json({ data: mockBugsList });
      }),
      http.get(apiTarget("/bugs/local"), ({ request }) => {
        const url = new URL(request.url);
        queryLocalBugsParams.push(Object.fromEntries(url.searchParams.entries()));
        return HttpResponse.json({ data: [] });
      }),
      http.get(apiTarget("/bugs/repos"), () => {
        queryBugReposCalled++;
        return HttpResponse.json({ data: ["repo-a", "repo-b"] });
      }),
      http.get(apiTarget("/bugs/categories"), () => {
        queryCategoriesCalled++;
        return HttpResponse.json({ data: ["cat-1", "cat-2"] });
      }),
      http.post(apiTarget("/bugs"), () => {
        createBugCalled++;
        return HttpResponse.json({ data: { id: "new-bug" } });
      }),
      http.post(apiTarget("/bugs/sync"), () => {
        syncBugsCalled++;
        return HttpResponse.json({ data: null });
      }),
      http.post(apiTarget("/bugs/:id/reject"), ({ params }) => {
        rejectLocalBugId = params.id as string;
        return HttpResponse.json({ data: { id: params.id } });
      }),
      http.post(apiTarget("/bugs/:id/restore"), ({ params }) => {
        restoreLocalBugId = params.id as string;
        return HttpResponse.json({ data: { id: params.id } });
      }),
      http.post(apiTarget("/bugs/:bugId/status"), async ({ request, params }) => {
        let body = {};
        try {
          body = (await request.json()) as any;
        } catch (e) {}
        updateBugStatusBody = {
          bugId: params.bugId,
          ...body,
        };
        return HttpResponse.json({ data: { id: params.bugId } });
      }),
    );
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

    expect(queryBugReposCalled).toBe(1);
    expect(queryCategoriesCalled).toBe(1);
    expect(queryBugsParams[0]).toEqual(result.current.filter);
  });

  it("should handle error during bug fetching gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    server.use(
      http.get(apiTarget("/bugs"), () => {
        return HttpResponse.json({ errorCode: 500, message: "Server Error" }, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.bugs).toEqual([]);
    expect(result.current.error).toBe("Server Error");

    consoleErrorSpy.mockRestore();
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

    server.use(
      http.get(apiTarget("/bugs/local"), ({ request }) => {
        const url = new URL(request.url);
        queryLocalBugsParams.push(Object.fromEntries(url.searchParams.entries()));
        return HttpResponse.json({ data: mockLocalBugs });
      }),
    );

    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setActiveTab("local");
    });

    await waitFor(() => {
      expect(queryLocalBugsParams.length).toBeGreaterThan(0);
    });

    expect(result.current.activeTab).toBe("local");
    expect(queryLocalBugsParams[0]).toEqual(expect.objectContaining({ status: "pending" }));
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

    expect(queryBugsParams[queryBugsParams.length - 1]).toEqual({
      repo: "repo-a",
      status: "open",
      priority: "high",
      search: "Bug One",
    });
  });

  it("should call createBug and refresh lists upon success", async () => {
    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsParams = [];

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
    expect(createBugCalled).toBe(1);
    expect(queryBugsParams).toHaveLength(1); // Refresh call
  });

  it("should call rejectLocalBug and refresh lists", async () => {
    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsParams = [];

    await act(async () => {
      await result.current.handleReject("1");
    });

    expect(rejectLocalBugId).toBe("1");
    expect(queryBugsParams).toHaveLength(1);
  });

  it("should call restoreLocalBug and refresh lists", async () => {
    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsParams = [];

    await act(async () => {
      await result.current.handleRestore("1");
    });

    expect(restoreLocalBugId).toBe("1");
    expect(queryBugsParams).toHaveLength(1);
  });

  it("should call updateBugStatus during handleApprove and refresh lists", async () => {
    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsParams = [];

    await act(async () => {
      await result.current.handleApprove("1", "approved", "Good to go");
    });

    expect(updateBugStatusBody).toEqual({
      bugId: "1",
      status: "approved",
      comment: "Good to go",
    });
    expect(queryBugsParams).toHaveLength(1);
  });

  it("should call syncBugs and refresh bugs", async () => {
    const { result } = renderHook(() => useBugList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsParams = [];

    await act(async () => {
      await result.current.handleSyncBugs();
    });

    expect(syncBugsCalled).toBe(1);
    expect(queryBugsParams).toHaveLength(1);
  });
});
