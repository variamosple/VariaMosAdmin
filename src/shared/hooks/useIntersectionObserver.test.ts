import { renderHook, act } from "@testing-library/react";
import useIntersectionObserver from "./useIntersectionObserver";

describe("useIntersectionObserver hook", () => {
  let mockDisconnect = vi.fn();
  let mockObserve = vi.fn();
  let observerCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the global IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      };
    });
  });

  it("should initialize hook and register intersection observer on node", () => {
    const mockSetPage = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(false, 1, mockSetPage));

    const dummyNode = document.createElement("div");

    act(() => {
      result.current.lastEntryRef(dummyNode);
    });

    expect(global.IntersectionObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledWith(dummyNode);
  });

  it("should increment page when intersecting and hasMore is true", () => {
    const mockSetPage = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(false, 1, mockSetPage));

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
    const { result } = renderHook(() => useIntersectionObserver(true, 1, mockSetPage));

    const dummyNode = document.createElement("div");
    act(() => {
      result.current.lastEntryRef(dummyNode);
    });

    expect(global.IntersectionObserver).not.toHaveBeenCalled();
    expect(mockSetPage).not.toHaveBeenCalled();
  });
});
