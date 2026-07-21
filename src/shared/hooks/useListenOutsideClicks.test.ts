import { renderHook } from "@testing-library/react";
import useListenOutsideClicks from "./useListenOutsideClicks";

describe("useListenOutsideClicks hook", () => {
  const mockOnOutsideClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger callback when clicking outside element", () => {
    const { result } = renderHook(() => useListenOutsideClicks(mockOnOutsideClick));

    // Set up dummy DOM elements
    const insideElement = document.createElement("div");
    const outsideElement = document.createElement("div");
    document.body.appendChild(insideElement);
    document.body.appendChild(outsideElement);

    // Assign ref element
    result.current.elementRef.current = insideElement;

    // Simulate click outside
    const clickOutsideEvent = new MouseEvent("click", { bubbles: true });
    outsideElement.dispatchEvent(clickOutsideEvent);

    expect(mockOnOutsideClick).toHaveBeenCalledTimes(1);

    // Cleanup DOM
    document.body.removeChild(insideElement);
    document.body.removeChild(outsideElement);
  });

  it("should NOT trigger callback when clicking inside element", () => {
    const { result } = renderHook(() => useListenOutsideClicks(mockOnOutsideClick));

    const insideElement = document.createElement("div");
    document.body.appendChild(insideElement);
    result.current.elementRef.current = insideElement;

    // Simulate click inside
    const clickInsideEvent = new MouseEvent("click", { bubbles: true });
    insideElement.dispatchEvent(clickInsideEvent);

    expect(mockOnOutsideClick).not.toHaveBeenCalled();

    document.body.removeChild(insideElement);
  });

  it("should remove click listener from document on unmount", () => {
    const removeSpy = jest.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useListenOutsideClicks(mockOnOutsideClick));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function), true);
    removeSpy.mockRestore();
  });
});
