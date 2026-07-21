import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MicroServiceRowComponent } from "./MicroserviceRow";
import { MicroService } from "../../domain/Entity/MicroService";

import * as MicroServiceRepository from "../../api/MicroServiceRepository";

const mockMicroservice: MicroService = {
  id: "test-id",
  names: ["test-micro"],
  state: "running",
  status: "up",
  created: new Date(),
  labels: {},
};

// Mock @variamosple/variamos-components to avoid ESM syntax errors
jest.mock("@variamosple/variamos-components", () => {
  return {
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
  };
});

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

describe("MicroServiceRowComponent WebSocket Logging", () => {
  const mockOnStart = jest.fn();
  const mockOnRestart = jest.fn();
  const mockOnStop = jest.fn();

  let watchLogsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockWebSocket as any).onopen = null;
    (mockWebSocket as any).onmessage = null;
    (mockWebSocket as any).onclose = null;
    watchLogsSpy = jest
      .spyOn(MicroServiceRepository, "watchMicroserviceLogs")
      .mockReturnValue(mockWebSocket as any);
  });

  afterEach(() => {
    watchLogsSpy.mockRestore();
  });

  it("opens websocket and streams logs when Show/Hide logs button is toggled", async () => {
    const user = userEvent.setup();
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

    await user.click(logButton);

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
    await user.click(logButton);
    expect(mockWebSocket.close).toHaveBeenCalledTimes(1);
  });
});
