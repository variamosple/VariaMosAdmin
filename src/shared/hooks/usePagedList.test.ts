import { act, renderHook, waitFor } from "@testing-library/react";
import { PagedModel, ResponseModel } from "@variamosple/variamos-components";
import { describe, expect, it, vi } from "vitest";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";
import { usePagedList } from "./usePagedList";

// The real paging hook and models: the wrapper is tested as it runs
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
    pageNumber = 1,
    pageSize = 10,
  ) {
    super(pageNumber, pageSize);
  }
}

const ok = (items: string[]) => {
  const response = new ResponseModel<string[]>("query");
  response.data = items;
  response.totalCount = items.length;
  return response;
};
const failed = (message?: string) =>
  new ResponseModel<string[]>("query").withError(500, message as string);

describe("usePagedList", () => {
  it("keeps the error of the last load and clears it on success", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(failed("The users could not be read."))
      .mockResolvedValueOnce(ok(["a"]));
    const { result } = renderHook(() =>
      usePagedList({ queryFunction: query, initialFilter: new NameFilter() }),
    );

    await act(() => result.current.loadData(new NameFilter()));
    expect(result.current.listState.error).toBe("The users could not be read.");

    act(() => result.current.listState.onRetry());
    await waitFor(() => {
      expect(result.current.listState.error).toBeNull();
    });
    expect(result.current.data).toEqual(["a"]);
    // Retry reloads the same filter
    expect(query).toHaveBeenLastCalledWith(query.mock.calls[0][0]);
  });

  it("falls back to the system message when the API sent none", async () => {
    const { result } = renderHook(() =>
      usePagedList({
        queryFunction: vi.fn().mockResolvedValue(failed()),
        initialFilter: new NameFilter(),
      }),
    );

    await act(() => result.current.loadData(new NameFilter()));

    expect(result.current.listState.error).toBe(SYSTEM_ERROR_MESSAGE);
  });

  it("tells a search from the full list, whatever the page", async () => {
    const { result } = renderHook(() =>
      usePagedList({
        queryFunction: vi.fn().mockResolvedValue(ok([])),
        initialFilter: new NameFilter(),
      }),
    );

    await act(() => result.current.loadData(new NameFilter(undefined, 3)));
    expect(result.current.listState.isFiltered).toBe(false);

    await act(() => result.current.loadData(new NameFilter("jane")));
    expect(result.current.listState.isFiltered).toBe(true);

    await act(() => result.current.loadData(new NameFilter("")));
    expect(result.current.listState.isFiltered).toBe(false);
  });
});
