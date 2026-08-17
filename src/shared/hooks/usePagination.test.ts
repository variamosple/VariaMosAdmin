import { act, renderHook } from "@testing-library/react";
import { usePagination } from "./usePagination";

describe("usePagination Hook", () => {
  it("should initialize pagination values correctly", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, pageSize: 10 }),
    );

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
  });

  it("should change page correctly within bounds", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, pageSize: 10 }),
    );

    // Go next -> 2
    act(() => {
      result.current.onPageChange(2);
    });
    expect(result.current.currentPage).toBe(2);

    // Go next -> 3
    act(() => {
      result.current.onPageChange(3);
    });
    expect(result.current.currentPage).toBe(3);

    // Go to out of bounds -> should remain 3
    act(() => {
      result.current.onPageChange(4);
    });
    expect(result.current.currentPage).toBe(3);

    // Go to out of bounds -> should remain 3
    act(() => {
      result.current.onPageChange(0);
    });
    expect(result.current.currentPage).toBe(3);

    // Go to page 1
    act(() => {
      result.current.onPageChange(1);
    });
    expect(result.current.currentPage).toBe(1);
  });

  it("should default pageSize to 10 and initialPage to 1", () => {
    const { result } = renderHook(() => usePagination({ totalItems: 15 }));
    expect(result.current.totalPages).toBe(2);
    expect(result.current.currentPage).toBe(1);
  });

  it("should adjust current page when total items shrink below the current page limits", () => {
    let totalItems = 35;
    const { result, rerender } = renderHook(() =>
      usePagination({ totalItems, pageSize: 10, initialPage: 4 }),
    );

    expect(result.current.currentPage).toBe(4);
    expect(result.current.totalPages).toBe(4);

    // Shrink total items
    totalItems = 5;
    rerender();

    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPage).toBe(1);
  });
});
