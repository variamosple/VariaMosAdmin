import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as MicroServiceRepository from "../../api/MicroServiceRepository";
import type { FollowUp } from "../../domain/actionFollowUp";
import type { MicroService } from "../../domain/Entity/MicroService";
import { MicroServiceRowComponent } from "./MicroserviceRow";

const mockMicroservice: MicroService = {
  serviceName: "test-micro",
  displayName: "Test Microservice",
  health: {
    status: "UP",
    serviceName: "test-micro",
    responseTimeMs: 15,
    checkedAt: new Date().toISOString(),
  },
  replicasCount: 1,
  containers: [],
  id: "test-id",
  names: ["test-micro"],
  state: "running",
  status: "up",
  created: new Date(),
  labels: {},
};

// Mock @variamosple/variamos-components to avoid ESM syntax errors
vi.mock("@variamosple/variamos-components", async () => {
  return {
    ResponseModel: class ResponseModel<T> {
      errorCode?: number;
      message?: string;
      data?: T;
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
vi.mock("@patternfly/react-log-viewer", async () => {
  return {
    LogViewer: ({ data }: { data: string }) => (
      <div data-testid="log-viewer">{data}</div>
    ),
  };
});

interface MockWebSocketType {
  send: import("vitest").Mock;
  close: import("vitest").Mock;
  onopen: (() => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
}

// Mock watchMicroserviceLogs API to return a mock WebSocket object
const mockWebSocket: MockWebSocketType = {
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
};

describe("MicroServiceRowComponent WebSocket Logging", () => {
  const mockOnStart = vi.fn();
  const mockOnRestart = vi.fn();
  const mockOnStop = vi.fn();

  let watchLogsSpy: import("vitest").MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocket.onopen = null;
    mockWebSocket.onmessage = null;
    mockWebSocket.onclose = null;
    watchLogsSpy = vi
      .spyOn(MicroServiceRepository, "watchMicroserviceLogs")
      .mockReturnValue(mockWebSocket as object as WebSocket);
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

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ microserviceId: "test-id" }),
    );

    await act(async () => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: "log line 1\n",
        });
      }
    });

    // Check that LogViewer renders the log line
    expect(screen.getByTestId("log-viewer").textContent).toBe("log line 1\n");

    // Close logs
    await user.click(logButton);
    expect(mockWebSocket.close).toHaveBeenCalledTimes(1);
  });
});

describe("MicroServiceRowComponent action follow-up (EV-86 lot 3)", () => {
  const renderRow = (followUp?: FollowUp) =>
    render(
      <table>
        <tbody>
          <MicroServiceRowComponent
            microService={mockMicroservice}
            onMicroServiceStart={vi.fn()}
            onMicroServiceRestart={vi.fn()}
            onMicroServiceStop={vi.fn()}
            followUp={followUp}
          />
        </tbody>
      </table>,
    );

  it("shows a restart under way instead of the last status, and blocks the actions", () => {
    renderRow({ step: "restarting", since: Date.now() });

    expect(screen.getByText("RESTARTING")).toBeInTheDocument();
    expect(screen.queryByText("UP")).not.toBeInTheDocument();
    expect(screen.getByTitle("Restart Service")).toBeDisabled();
    expect(screen.getByTitle("Stop Service")).toBeDisabled();
  });

  it("shows a service not back, and lets the operator act again", () => {
    renderRow({ step: "failed", since: Date.now() });

    expect(screen.getByText("NOT BACK")).toBeInTheDocument();
    expect(screen.getByTitle("Restart Service")).toBeEnabled();
  });
});

describe("MicroServiceRowComponent latency", () => {
  it("shows the latency of a degraded service, which explains its status", () => {
    render(
      <table>
        <tbody>
          <MicroServiceRowComponent
            microService={{
              ...mockMicroservice,
              health: {
                status: "DEGRADED",
                serviceName: "test-micro",
                responseTimeMs: 2400,
              },
            }}
            onMicroServiceStart={vi.fn()}
            onMicroServiceRestart={vi.fn()}
            onMicroServiceStop={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("DEGRADED")).toBeInTheDocument();
    expect(screen.getByText("2400 ms")).toBeInTheDocument();
  });
});
