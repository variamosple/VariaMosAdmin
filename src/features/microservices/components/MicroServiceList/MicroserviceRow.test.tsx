import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MicroServiceRowComponent } from "./MicroserviceRow";
import { MicroService } from "../../domain/Entity/MicroService";

const mockMicroservice: MicroService = {
  id: "test-id",
  names: ["test-micro"],
  state: "running",
  status: "up",
  created: new Date(),
  labels: {},
};

// Mock patternfly log viewer
jest.mock("@patternfly/react-log-viewer", () => {
  return {
    LogViewer: ({ data }: { data: string }) => <div data-testid="log-viewer">{data}</div>,
  };
});

// Mock watchMicroserviceLogs API to return a mock WebSocket object
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
};

jest.mock("../../api/MicroServiceRepository", () => {
  return {
    watchMicroserviceLogs: () => mockWebSocket,
  };
});

describe("MicroServiceRowComponent WebSocket Logging", () => {
  const mockOnStart = jest.fn();
  const mockOnRestart = jest.fn();
  const mockOnStop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (mockWebSocket as any).onopen = null;
    (mockWebSocket as any).onmessage = null;
    (mockWebSocket as any).onclose = null;
  });

  it("opens websocket and streams logs when Show/Hide logs button is toggled", async () => {
    render(
      <table>
        <tbody>
          <MicroServiceRowComponent
            microService={mockMicroservice}
            onMicroServiceStart={mockOnStart}
            onMicroServiceRestart={mockOnRestart}
            onMicroServiceStop={mockOnStop}
          />
        </tbody>
      </table>,
    );

    const logButton = screen.getByTitle("Show/Hide logs");

    fireEvent.click(logButton);

    // Simulate websocket open
    await act(async () => {
      if (mockWebSocket.onopen) {
        (mockWebSocket.onopen as () => void)();
      }
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ microserviceId: "test-id" }));

    // Simulate receiving message
    await act(async () => {
      if (mockWebSocket.onmessage) {
        (mockWebSocket.onmessage as (ev: any) => void)({ data: "log line 1\n" });
      }
    });

    // Check that LogViewer renders the log line
    expect(screen.getByTestId("log-viewer").textContent).toBe("log line 1\n");

    // Close logs
    fireEvent.click(logButton);
    expect(mockWebSocket.close).toHaveBeenCalledTimes(1);
  });
});
