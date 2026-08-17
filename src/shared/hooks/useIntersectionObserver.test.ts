import { act, renderHook } from "@testing-library/react";
import useIntersectionObserver from "./useIntersectionObserver";

describe("useIntersectionObserver hook", () => {
  const mockDisconnect = vi.fn();
  const mockObserve = vi.fn();
  let observerCallback: IntersectionObserverCallback;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the global IntersectionObserver
    global.IntersectionObserver = vi.fn(
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback;
        }
        observe = mockObserve;
        disconnect = mockDisconnect;
        unobserve = vi.fn();
        takeRecords = vi.fn();
        root = null;
        rootMargin = "";
        thresholds = [];
      },
    ) as unknown as typeof global.IntersectionObserver;
  });

  it("should initialize hook and register intersection observer on node", () => {
    const mockSetPage = vi.fn();
    const { result } = renderHook(() =>
      useIntersectionObserver(false, 1, mockSetPage),
    );

    const dummyNode = document.createElement("div");

    act(() => {
      result.current.lastEntryRef(dummyNode);
    });

    expect(global.IntersectionObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledWith(dummyNode);
  });

  it("should increment page when intersecting and hasMore is true", () => {
    const mockSetPage = vi.fn();
    const { result } = renderHook(() =>
      useIntersectionObserver(false, 1, mockSetPage),
    );

    const dummyNode = document.createElement("div");
    act(() => {
      result.current.lastEntryRef(dummyNode);
    });

    // Simulate intersection entry
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(mockSetPage).toHaveBeenCalled();
  });

  it("should not increment page if isDataLoading is true", () => {
    const mockSetPage = vi.fn();
    const { result } = renderHook(() =>
      useIntersectionObserver(true, 1, mockSetPage),
    );

    const dummyNode = document.createElement("div");
    act(() => {
      result.current.lastEntryRef(dummyNode);
    });

    expect(global.IntersectionObserver).not.toHaveBeenCalled();
    expect(mockSetPage).not.toHaveBeenCalled();
  });
});
