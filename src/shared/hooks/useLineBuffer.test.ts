import { renderHook, act } from "@testing-library/react";
import { useLineBuffer } from "./useLineBuffer";

describe("useLineBuffer hook", () => {
  it("should initialize with an empty buffer", () => {
    const { result } = renderHook(() => useLineBuffer(100));
    expect(result.current.buffer).toBe("");
  });

  it("should append content to the buffer", () => {
    const { result } = renderHook(() => useLineBuffer(100));

    act(() => {
      result.current.addToBuffer("line 1\n");
    });
    expect(result.current.buffer).toBe("line 1\n");

    act(() => {
      result.current.addToBuffer("line 2\n");
    });
    expect(result.current.buffer).toBe("line 1\nline 2\n");
  });

  it("should shift lines when buffer length exceeds maxSize", () => {
    // maxSize is 15. "line 1\nline 2\n" is 14 chars. Appending "line 3\n" makes it 21.
    const { result } = renderHook(() => useLineBuffer(15));

    act(() => {
      result.current.addToBuffer("line 1\n");
    });
    act(() => {
      result.current.addToBuffer("line 2\n");
    });
    expect(result.current.buffer).toBe("line 1\nline 2\n");

    act(() => {
      result.current.addToBuffer("line 3\n");
    });

    // It should have discarded "line 1\n" and now contain "line 2\nline 3\n"
    expect(result.current.buffer).toBe("line 2\nline 3\n");
  });
});
