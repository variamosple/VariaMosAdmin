import { act, render, screen, waitFor } from "@testing-library/react";
import {
  PagedModel,
  ResponseModel,
  usePaginatedQuery,
} from "@variamosple/variamos-components";
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  paramsOf,
  readBooleanParam,
  readPage,
  readParam,
  useListQueryState,
} from "./useListQueryState";

// The real paging hook and models: the address follows the hook as it runs
vi.mock("@variamosple/variamos-components", async () => {
  const dist = "@variamosple/variamos-components/dist";
  const [hook, paged, response] = await Promise.all([
    import(`${dist}/Hooks/usePaginatedQuery.js`),
    import(`${dist}/Model/PagedModel.js`),
    import(`${dist}/Model/ResponseModel.js`),
  ]);
  return {
    usePaginatedQuery: hook.usePaginatedQuery,
    PagedModel: paged.PagedModel,
    ResponseModel: response.ResponseModel,
  };
});

class NameFilter extends PagedModel {
  constructor(
    public name?: string,
    public archived?: boolean,
    pageNumber = 1,
  ) {
    super(pageNumber, 10);
  }
}

const fromParams = (params: URLSearchParams) =>
  new NameFilter(
    readParam(params, "name"),
    readBooleanParam(params, "archived"),
    readPage(params),
  );

const query = vi.fn((filter: NameFilter) => {
  const response = new ResponseModel<string[]>("query");
  response.data = [`${filter.name ?? "all"} p${filter.pageNumber}`];
  response.totalCount = 30;
  return Promise.resolve(response);
});

let controls: {
  search: (name: string) => void;
  page: (page: number) => void;
};

const TestList = () => {
  const paged = usePaginatedQuery<NameFilter, string>({
    queryFunction: query,
    initialFilter: new NameFilter(),
  });
  const { restoredFilter } = useListQueryState(paged, fromParams);
  const { search } = useLocation();
  controls = {
    search: (name) => void paged.loadData(new NameFilter(name)),
    page: (page) => paged.onPageChange(page),
  };
  return (
    <>
      <p>items: {paged.data.join(",")}</p>
      <p>address: {search}</p>
      <p>restored: {restoredFilter?.name ?? "-"}</p>
    </>
  );
};

const renderAt = (entry: string) => {
  const router = createMemoryRouter(
    [{ path: "/list", element: <TestList /> }],
    {
      initialEntries: [entry],
    },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe("useListQueryState", () => {
  it("loads the search and the page written in the address, once", async () => {
    query.mockClear();
    renderAt("/list?page=2&name=jane");

    expect(await screen.findByText("items: jane p2")).toBeInTheDocument();
    expect(screen.getByText("restored: jane")).toBeInTheDocument();
    expect(query).toHaveBeenCalledOnce();
  });

  it("adds a history entry per page, so that Back shows the previous page", async () => {
    const router = renderAt("/list");
    await screen.findByText("items: all p1");

    act(() => controls.page(2));
    expect(await screen.findByText("items: all p2")).toBeInTheDocument();
    expect(screen.getByText("address: ?page=2")).toBeInTheDocument();

    await act(() => router.navigate(-1));
    expect(await screen.findByText("items: all p1")).toBeInTheDocument();
    expect(screen.getByText("address:")).toBeInTheDocument();
    // Going back writes nothing: Forward still leads to page 2
    expect(router.state.historyAction).toBe("POP");
    await act(() => router.navigate(1));
    expect(await screen.findByText("items: all p2")).toBeInTheDocument();
    expect(router.state.historyAction).toBe("POP");
  });

  it("replaces the entry on a search, and the page starts again", async () => {
    const router = renderAt("/list?page=3");
    await screen.findByText("items: all p3");

    act(() => controls.search("ana"));
    expect(await screen.findByText("items: ana p1")).toBeInTheDocument();
    expect(screen.getByText("address: ?name=ana")).toBeInTheDocument();
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("gives the restored search back to the form after Back", async () => {
    const router = renderAt("/list?name=a");
    await screen.findByText("items: a p1");
    act(() => controls.page(2));
    await screen.findByText("items: a p2");
    act(() => controls.search("ab"));
    await screen.findByText("items: ab p1");

    await act(() => router.navigate(-1));

    await waitFor(() =>
      expect(screen.getByText("items: a p1")).toBeInTheDocument(),
    );
    expect(screen.getByText("restored: a")).toBeInTheDocument();
  });
});

describe("paramsOf and the readers", () => {
  it("writes the fields that have a value, and the page from 2 on", () => {
    expect(paramsOf(new NameFilter("jane", false, 2)).toString()).toBe(
      "name=jane&archived=false&page=2",
    );
    expect(paramsOf(new NameFilter("", undefined, 1)).toString()).toBe("");
  });

  it("reads back what it wrote, and ignores what it cannot read", () => {
    const params = new URLSearchParams("archived=maybe&page=-4&name=");
    expect(fromParams(params)).toEqual(new NameFilter(undefined, undefined, 1));
    expect(fromParams(paramsOf(new NameFilter("jane", true, 3)))).toEqual(
      new NameFilter("jane", true, 3),
    );
  });
});
