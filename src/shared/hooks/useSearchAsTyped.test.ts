import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSearchAsTyped } from "./useSearchAsTyped";

describe("useSearchAsTyped", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not search while the form is untouched", () => {
    const search = vi.fn(() => Promise.resolve());
    renderHook(() => useSearchAsTyped(false, search));

    vi.advanceTimersByTime(1000);

    expect(search).not.toHaveBeenCalled();
  });

  it("searches once the typing pauses", () => {
    const search = vi.fn(() => Promise.resolve());
    renderHook(() => useSearchAsTyped(true, search));

    vi.advanceTimersByTime(499);
    expect(search).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("waits again when the search changes before the pause ends", () => {
    const first = vi.fn(() => Promise.resolve());
    const second = vi.fn(() => Promise.resolve());
    const { rerender } = renderHook(
      ({ search }) => useSearchAsTyped(true, search),
      { initialProps: { search: first } },
    );

    vi.advanceTimersByTime(300);
    rerender({ search: second });
    vi.advanceTimersByTime(300);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does not search after the form is gone", () => {
    const search = vi.fn(() => Promise.resolve());
    const { unmount } = renderHook(() => useSearchAsTyped(true, search));

    unmount();
    vi.advanceTimersByTime(1000);

    expect(search).not.toHaveBeenCalled();
  });
});
