import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import type { Bug } from "../domain/Bug";
import { useBugList } from "./useBugList";

// Mock the variamos-components library which is published as ES Module
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
  let queryBugsParams: Record<string, string>[] = [];
  let queryLocalBugsParams: Record<string, string>[] = [];
  let queryBugReposCalled = 0;
  let queryCategoriesCalled = 0;
  let createBugCalled = 0;
  let syncBugsCalled = 0;
  let rejectLocalBugId: string | null = null;
  let restoreLocalBugId: string | null = null;
  interface UpdateStatusBody {
    status?: string;
    comment?: string;
    title?: string;
    description?: string;
    priority?: string;
    category?: string;
    githubRepo?: string;
  }
  let updateBugStatusBody: ({ bugId: string } & UpdateStatusBody) | null = null;

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
        queryLocalBugsParams.push(
          Object.fromEntries(url.searchParams.entries()),
        );
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
      http.post(
        apiTarget("/bugs/:bugId/status"),
        async ({ request, params }) => {
          let body = {};
          try {
            body = (await request.json()) as UpdateStatusBody;
          } catch (_e) {}
          updateBugStatusBody = {
            bugId: params.bugId as string,
            ...body,
          };
          return HttpResponse.json({ data: { id: params.bugId as string } });
        },
      ),
    );
  });

  it("should initialize with default states and fetch repos, categories, and bugs on mount", async () => {
    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

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
    expect(queryBugsParams[0]).toEqual({
      ...result.current.filter,
      pageNumber: "1",
      pageSize: "20",
    });
  });

  it("should handle error during bug fetching gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    server.use(
      http.get(apiTarget("/bugs"), () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Server Error" },
          { status: 500 },
        );
      }),
    );

    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.bugs).toEqual([]);
    expect(result.current.loadError).toBe(SYSTEM_ERROR_MESSAGE);
    expect(result.current.error).toBeNull();

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
        queryLocalBugsParams.push(
          Object.fromEntries(url.searchParams.entries()),
        );
        return HttpResponse.json({ data: mockLocalBugs });
      }),
    );

    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

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
    expect(queryLocalBugsParams[0]).toEqual(
      expect.objectContaining({ status: "pending" }),
    );
    expect(result.current.bugs).toEqual(mockLocalBugs);
  });

  it("should filter bugs when setFilter is called", async () => {
    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

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
      pageNumber: "1",
      pageSize: "20",
    });
  });

  describe("pages", () => {
    // 45 GitHub bugs: three pages of 20
    const serveGithubBugs = (totalCount?: number) =>
      server.use(
        http.get(apiTarget("/bugs"), ({ request }) => {
          const url = new URL(request.url);
          queryBugsParams.push(Object.fromEntries(url.searchParams.entries()));
          return HttpResponse.json({ data: mockBugsList, totalCount });
        }),
      );
    const lastPageAsked = () => queryBugsParams.at(-1)?.pageNumber;

    it("asks for the page chosen and counts the pages", async () => {
      serveGithubBugs(45);
      const { result } = renderHook(() => useBugList(), {
        wrapper: MemoryRouter,
      });
      await waitFor(() => expect(result.current.totalPages).toBe(3));

      await act(async () => result.current.onPageChange(3));

      await waitFor(() => expect(lastPageAsked()).toBe("3"));
      expect(result.current.currentPage).toBe(3);
    });

    it("starts again from the first page with another filter or tab", async () => {
      serveGithubBugs(45);
      const { result } = renderHook(() => useBugList(), {
        wrapper: MemoryRouter,
      });
      await waitFor(() => expect(result.current.totalPages).toBe(3));

      await act(async () => result.current.onPageChange(2));
      await act(async () => result.current.setFilter({ priority: "high" }));
      await waitFor(() =>
        expect(queryBugsParams.at(-1)).toMatchObject({
          priority: "high",
          pageNumber: "1",
        }),
      );

      await act(async () => result.current.onPageChange(2));
      await act(async () => result.current.setActiveTab("local"));
      await waitFor(() =>
        expect(queryLocalBugsParams.at(-1)?.pageNumber).toBe("1"),
      );
    });

    it("goes back to the last page when its bugs are gone", async () => {
      serveGithubBugs(45);
      const { result } = renderHook(() => useBugList(), {
        wrapper: MemoryRouter,
      });
      await waitFor(() => expect(result.current.totalPages).toBe(3));
      await act(async () => result.current.onPageChange(3));
      await waitFor(() => expect(lastPageAsked()).toBe("3"));

      // The last five bugs were closed elsewhere
      serveGithubBugs(40);
      await act(async () => result.current.refreshBugs());

      await waitFor(() => expect(result.current.currentPage).toBe(2));
      await waitFor(() => expect(lastPageAsked()).toBe("2"));
    });

    it("shows one page when the server sends no count", async () => {
      serveGithubBugs();
      const { result } = renderHook(() => useBugList(), {
        wrapper: MemoryRouter,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.bugs).toEqual(mockBugsList);
      expect(result.current.totalPages).toBe(1);
    });
  });

  it("should call createBug and refresh lists upon success", async () => {
    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    queryBugsParams = [];

    let createSuccess = false;
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
    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

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
    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

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
    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

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
    const { result } = renderHook(() => useBugList(), {
      wrapper: MemoryRouter,
    });

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

  describe("address of the list (UX-26)", () => {
    const at =
      (entry: string) =>
      ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
      );

    // Enough bugs for page 3: no move back to the last page
    const answerManyBugs = () =>
      server.use(
        http.get(apiTarget("/bugs"), ({ request }) => {
          queryBugsParams.push(
            Object.fromEntries(new URL(request.url).searchParams.entries()),
          );
          return HttpResponse.json({ data: mockBugsList, totalCount: 60 });
        }),
        http.get(apiTarget("/bugs/local"), ({ request }) => {
          queryLocalBugsParams.push(
            Object.fromEntries(new URL(request.url).searchParams.entries()),
          );
          return HttpResponse.json({ data: mockBugsList, totalCount: 60 });
        }),
      );

    it("loads the bugs once when the page opens", async () => {
      renderHook(() => useBugList(), { wrapper: MemoryRouter });

      await waitFor(() => expect(queryBugsParams).toHaveLength(1));
      // A second load would come after the first one
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(queryBugsParams).toHaveLength(1);
    });

    it("opens the tab, the filters and the page written in the address", async () => {
      answerManyBugs();
      const { result } = renderHook(() => useBugList(), {
        wrapper: at("/bugs?tab=local&search=crash&priority=high&page=2"),
      });

      await waitFor(() => expect(queryLocalBugsParams).toHaveLength(1));
      expect(queryLocalBugsParams[0]).toMatchObject({
        search: "crash",
        priority: "high",
        pageNumber: "2",
        status: "pending",
      });
      expect(queryBugsParams).toHaveLength(0);
      expect(result.current.activeTab).toBe("local");
      expect(result.current.currentPage).toBe(2);
      expect(result.current.filter).toEqual({
        search: "crash",
        priority: "high",
      });
    });

    it("ignores an unknown tab", async () => {
      const { result } = renderHook(() => useBugList(), {
        wrapper: at("/bugs?tab=secret"),
      });

      await waitFor(() => expect(queryBugsParams).toHaveLength(1));
      expect(result.current.activeTab).toBe("github");
    });

    it("keeps the filters across tabs and starts the new tab on page 1", async () => {
      answerManyBugs();
      const { result } = renderHook(() => useBugList(), {
        wrapper: at("/bugs?search=crash&page=3"),
      });
      await waitFor(() => expect(queryBugsParams).toHaveLength(1));

      act(() => result.current.setActiveTab("trash"));

      await waitFor(() => expect(queryLocalBugsParams).toHaveLength(1));
      expect(queryLocalBugsParams[0]).toMatchObject({
        search: "crash",
        pageNumber: "1",
        status: "rejected",
      });
    });
  });
});
