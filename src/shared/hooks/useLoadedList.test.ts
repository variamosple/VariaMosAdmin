import { act, renderHook } from "@testing-library/react";
import { ResponseModel } from "@variamosple/variamos-components";
import { describe, expect, it, vi } from "vitest";
import { useLoadedList } from "./useLoadedList";

// The ResponseModel of the tests (setupTests.ts): withError sets the code
const listOf = (items: string[], totalCount?: number) => {
  const response = new ResponseModel<string[]>("t");
  response.data = items;
  response.totalCount = totalCount;
  return response;
};

describe("useLoadedList", () => {
  it("reads nothing until load is called", () => {
    const query = vi.fn();
    const { result } = renderHook(() => useLoadedList(query, "Failed."));

    expect(query).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      items: [],
      total: 0,
      loading: false,
      error: null,
    });
  });

  it("keeps the items and the total of the server", async () => {
    const query = vi.fn().mockResolvedValue(listOf(["a", "b"], 12));
    const { result } = renderHook(() => useLoadedList(query, "Failed."));

    await act(() => result.current.load());

    expect(result.current).toMatchObject({
      items: ["a", "b"],
      total: 12,
      loading: false,
      error: null,
    });
  });

  it("counts the items when the server gives no total", async () => {
    const query = vi.fn().mockResolvedValue(listOf(["a", "b"]));
    const { result } = renderHook(() => useLoadedList(query, "Failed."));

    await act(() => result.current.load());

    expect(result.current.total).toBe(2);
  });

  it("gives the message of the server, or the default one", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(
        new ResponseModel<string[]>("t").withError(500, "Down"),
      )
      .mockResolvedValueOnce(
        new ResponseModel<string[]>("t").withError(500, ""),
      );
    const { result } = renderHook(() => useLoadedList(query, "Failed."));

    await act(() => result.current.load());
    expect(result.current.error).toBe("Down");

    await act(() => result.current.load());
    expect(result.current.error).toBe("Failed.");
    expect(result.current.items).toEqual([]);
  });
});
