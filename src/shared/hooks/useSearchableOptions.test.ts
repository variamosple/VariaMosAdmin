import { act, renderHook, waitFor } from "@testing-library/react";
import { ResponseModel } from "@variamosple/variamos-components";
import { useSearchableOptions } from "./useSearchableOptions";

vi.mock("@variamosple/variamos-components", async () =>
  (await import("@/shared/tests/mocks/variamosComponents")).variamosComponents({
    // The search is used at once: the delay is not what is tested here
    useDebouncedValue: <T>(value: T) => [value] as never,
  }),
);

interface Item {
  id: number;
  name: string;
}

const PAGE_SIZE = 20;
const ALL: Item[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: i === 24 ? "users::update" : `permission ${i + 1}`,
}));

const page = (items: Item[], total: number) => {
  const response = new ResponseModel<Item[]>("t");
  response.data = items;
  response.totalCount = total;
  return response;
};

/** A server that pages and filters like the admin API. */
const server = vi.fn(async (search: string, pageNumber: number) => {
  const found = ALL.filter((item) => item.name.includes(search));
  const start = (pageNumber - 1) * PAGE_SIZE;
  return page(found.slice(start, start + PAGE_SIZE), found.length);
});

const toOption = ({ id, name }: Item) => ({ label: name, value: id });

// The last option comes into view when the test says so
let observeLastOption: (isIntersecting: boolean) => void = () => {};
const reachLastOption = () => observeLastOption(true);
class ControlledIntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe() {
    observeLastOption = (isIntersecting) =>
      this.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as never,
      );
  }
  disconnect() {}
}

const renderOptions = (query = server) => {
  const hook = renderHook(() => useSearchableOptions({ query, toOption }));
  // The select gives its last option to the hook, as InfiniteSelect does
  const showLastOption = () =>
    act(() => {
      hook.result.current.lastOptionRef(document.createElement("button"));
    });
  return { ...hook, showLastOption };
};

describe("useSearchableOptions", () => {
  const setupObserver = window.IntersectionObserver;

  beforeEach(() => {
    window.IntersectionObserver = ControlledIntersectionObserver as never;
    server.mockClear();
  });

  afterEach(() => {
    window.IntersectionObserver = setupObserver;
  });

  it("loads the first page, then the next one when the last option comes into view", async () => {
    const { result, showLastOption } = renderOptions();
    await waitFor(() => expect(result.current.options).toHaveLength(20));
    expect(result.current.isFetching).toBe(false);

    showLastOption();
    act(() => reachLastOption());

    await waitFor(() => expect(result.current.options).toHaveLength(25));
    expect(server).toHaveBeenLastCalledWith("", 2);
  });

  it("says it is fetching while the next page loads, and asks nothing for an option out of view", async () => {
    const { result, showLastOption } = renderOptions();
    expect(result.current.searchInput).toBe("");
    await waitFor(() => expect(result.current.options).toHaveLength(20));
    showLastOption();

    act(() => observeLastOption(false));
    expect(server).toHaveBeenCalledOnce();

    act(() => reachLastOption());
    expect(result.current.isFetching).toBe(true);
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(server).toHaveBeenLastCalledWith("", 2);
  });

  it("starts a new search from its first page and replaces the list (role test flaky since 2026-11-02)", async () => {
    const { result, showLastOption } = renderOptions();
    await waitFor(() => expect(result.current.options).toHaveLength(20));
    showLastOption();
    act(() => reachLastOption());
    await waitFor(() => expect(result.current.options).toHaveLength(25));

    act(() => result.current.onSearchChange("users::update"));

    await waitFor(() =>
      expect(result.current.options).toEqual([
        { label: "users::update", value: 25 },
      ]),
    );
    expect(server).toHaveBeenLastCalledWith("users::update", 1);
    expect(result.current.searchInput).toBe("users::update");
  });

  it("asks no further page when the list is complete", async () => {
    const { result, showLastOption } = renderOptions();
    act(() => result.current.onSearchChange("users::"));
    await waitFor(() => expect(result.current.options).toHaveLength(1));
    const calls = server.mock.calls.length;

    showLastOption();
    act(() => reachLastOption());

    expect(server).toHaveBeenCalledTimes(calls);
  });

  it("drops the answer to an older search that comes back last", async () => {
    let answerOld: (response: ResponseModel<Item[]>) => void = () => {};
    const query = vi.fn((search: string, pageNumber: number) =>
      search === "perm"
        ? new Promise<ResponseModel<Item[]>>((resolve) => {
            answerOld = resolve;
          })
        : server(search, pageNumber),
    );
    const { result } = renderOptions(query);
    await waitFor(() => expect(result.current.options).toHaveLength(20));

    act(() => result.current.onSearchChange("perm"));
    act(() => result.current.onSearchChange("users"));
    await waitFor(() => expect(result.current.options).toHaveLength(1));
    await act(async () => answerOld(page(ALL.slice(0, 20), 24)));

    expect(result.current.options).toEqual([
      { label: "users::update", value: 25 },
    ]);
  });

  it.each([
    [
      "an error answer",
      async () => new ResponseModel<Item[]>("t").withError(500, "Unavailable"),
    ],
    [
      "a request that throws",
      async (): Promise<ResponseModel<Item[]>> => {
        throw new Error("Network down");
      },
    ],
  ])("ends the list on %s instead of asking again", async (_, answer) => {
    const query = vi.fn(answer);
    const { result, showLastOption } = renderOptions(query);
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.options).toEqual([]);

    showLastOption();
    act(() => reachLastOption());

    expect(query).toHaveBeenCalledTimes(1);
  });

  it("shows the chosen label and the whole list again once an option is chosen", async () => {
    const { result } = renderOptions();
    act(() => result.current.onSearchChange("users"));
    await waitFor(() => expect(result.current.options).toHaveLength(1));

    act(() =>
      result.current.onOptionChosen({ label: "users::update", value: 25 }),
    );

    expect(result.current.searchInput).toBe("users::update");
    await waitFor(() => expect(result.current.options).toHaveLength(20));
    expect(server).toHaveBeenLastCalledWith("", 1);
  });
});
