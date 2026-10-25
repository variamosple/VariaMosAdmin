import { act, renderHook } from "@testing-library/react";
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

  it("empties the buffer when its last line alone exceeds maxSize", () => {
    const { result } = renderHook(() => useLineBuffer(5));

    act(() => {
      result.current.addToBuffer("a\nlong line");
    });

    expect(result.current.buffer).toBe("");
  });

  it("keeps the lines that dropping the oldest one by one keeps", () => {
    // Former implementation: one split and join per dropped line
    const dropOneByOne = (buffer: string, maxSize: number) => {
      let updated = buffer;
      const lines = updated.split("\n");
      while (updated.length > maxSize && lines.length > 0) {
        lines.shift();
        updated = lines.join("\n");
      }
      return updated;
    };
    let seed = 7;
    const next = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % max;
    };

    for (const maxSize of [1, 8, 40, 200]) {
      const { result } = renderHook(() => useLineBuffer(maxSize));
      let expected = "";
      for (let i = 0; i < 200; i++) {
        const chunk = Array.from({ length: next(30) }, () =>
          next(5) === 0 ? "\n" : "x",
        ).join("");
        act(() => {
          result.current.addToBuffer(chunk);
        });
        expected = dropOneByOne(expected + chunk, maxSize);
        expect(result.current.buffer).toBe(expected);
      }
    }
  });
});
