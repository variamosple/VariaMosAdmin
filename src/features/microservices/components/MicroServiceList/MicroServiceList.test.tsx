import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MicroServiceList } from "./index";
import { MicroService } from "../../domain/Entity/MicroService";

import * as MicroServiceRepository from "../../api/MicroServiceRepository";

const mockMicroservices: MicroService[] = [
  { id: "1", names: ["micro-1"], state: "exited", status: "down", created: new Date(), labels: {} },
  { id: "2", names: ["micro-2"], state: "running", status: "up", created: new Date(), labels: {} },
];

// Mock the variamos-components library which has Paginator
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
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

// Mock the patternfly log viewer to avoid importing style files or complex web socket interactions
jest.mock("@patternfly/react-log-viewer", () => {
  return {
    LogViewer: () => <div data-testid="log-viewer">LogViewer</div>,
  };
});

describe("MicroServiceList Component", () => {
  const mockOnStart = jest.fn();
  const mockOnRestart = jest.fn();
  const mockOnStop = jest.fn();
  let watchLogsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    watchLogsSpy = jest.spyOn(MicroServiceRepository, "watchMicroserviceLogs").mockReturnValue({
      close: jest.fn(),
    } as any);
  });

  afterEach(() => {
    watchLogsSpy.mockRestore();
  });

  it("renders a list of microservices correctly", () => {
    render(
      <MicroServiceList
        items={mockMicroservices}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onMicroServiceStart={mockOnStart}
        onMicroServiceRestart={mockOnRestart}
        onMicroServiceStop={mockOnStop}
      />,
    );

    expect(screen.getByText("micro-1")).toBeInTheDocument();
    expect(screen.getByText("micro-2")).toBeInTheDocument();
  });

  it("triggers start/restart/stop calls appropriately", async () => {
    const user = userEvent.setup();
    render(
      <MicroServiceList
        items={mockMicroservices}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onMicroServiceStart={mockOnStart}
        onMicroServiceRestart={mockOnRestart}
        onMicroServiceStop={mockOnStop}
      />,
    );

    // micro-1 is exited, so it has a start button
    const startButton = screen.getByTitle("Start Microservice");
    await user.click(startButton);
    expect(mockOnStart).toHaveBeenCalledWith(mockMicroservices[0]);

    // micro-2 is running, so it has restart and stop buttons
    const restartButton = screen.getByTitle("Restart Microservice");
    await user.click(restartButton);
    expect(mockOnRestart).toHaveBeenCalledWith(mockMicroservices[1]);

    const stopButton = screen.getByTitle("Stop Microservice");
    await user.click(stopButton);
    expect(mockOnStop).toHaveBeenCalledWith(mockMicroservices[1]);
  });
});
