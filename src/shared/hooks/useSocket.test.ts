import { renderHook, act } from "@testing-library/react";
import { useSocket } from "./useSocket";

describe("useSocket Hook", () => {
  let mockWebSocket: any;
  let mockSocketFunction: jest.Mock;

  beforeEach(() => {
    mockWebSocket = {
      close: jest.fn(),
    };
    mockSocketFunction = jest.fn().mockReturnValue(mockWebSocket);
  });

  it("should not connect on mount if connectOnMount is false", () => {
    const { result } = renderHook(() => useSocket(mockSocketFunction, false));

    expect(result.current.socket).toBeNull();
    expect(mockSocketFunction).not.toHaveBeenCalled();
  });

  it("should connect on mount if connectOnMount is true and close on unmount", () => {
    const { result, unmount } = renderHook(() => useSocket(mockSocketFunction, true));

    expect(result.current.socket).toBe(mockWebSocket);
    expect(mockSocketFunction).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockWebSocket.close).toHaveBeenCalledTimes(1); // hook unmount cleanup
  });

  it("should connect manually when connect is called", () => {
    const { result } = renderHook(() => useSocket(mockSocketFunction, false));

    let conn;
    act(() => {
      conn = result.current.connect();
    });

    expect(conn).toBe(mockWebSocket);
    expect(result.current.socket).toBe(mockWebSocket);
    expect(mockSocketFunction).toHaveBeenCalledTimes(1);
  });

  it("should handle error when socketFunction throws", () => {
    const spyConsole = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSocketFunction.mockImplementation(() => {
      throw new Error("Socket connection failed");
    });

    const { result } = renderHook(() => useSocket(mockSocketFunction, false));

    let conn;
    act(() => {
      conn = result.current.connect();
    });

    expect(conn).toBeUndefined();
    expect(result.current.socket).toBeNull();
    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });
});
