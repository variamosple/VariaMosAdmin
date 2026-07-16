import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MicroServiceList } from "./index";
import { MicroService } from "../../domain/Entity/MicroService";

const mockMicroservices: MicroService[] = [
  { id: "1", names: ["micro-1"], state: "exited", status: "down", created: new Date(), labels: {} },
  { id: "2", names: ["micro-2"], state: "running", status: "up", created: new Date(), labels: {} },
];

// Mock the variamos-components library which has Paginator
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
  };
});

// Mock the patternfly log viewer to avoid importing style files or complex web socket interactions
jest.mock("@patternfly/react-log-viewer", () => {
  return {
    LogViewer: () => <div data-testid="log-viewer">LogViewer</div>,
  };
});

// Mock watchMicroserviceLogs
jest.mock("../../api/MicroServiceRepository", () => {
  return {
    watchMicroserviceLogs: () => {
      return {
        close: jest.fn(),
      };
    },
  };
});

describe("MicroServiceList Component", () => {
  const mockOnStart = jest.fn();
  const mockOnRestart = jest.fn();
  const mockOnStop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(screen.getByText("micro-1")).toBeDefined();
    expect(screen.getByText("micro-2")).toBeDefined();
  });

  it("triggers start/restart/stop calls appropriately", () => {
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
    fireEvent.click(startButton);
    expect(mockOnStart).toHaveBeenCalledWith(mockMicroservices[0]);

    // micro-2 is running, so it has restart and stop buttons
    const restartButton = screen.getByTitle("Restart Microservice");
    fireEvent.click(restartButton);
    expect(mockOnRestart).toHaveBeenCalledWith(mockMicroservices[1]);

    const stopButton = screen.getByTitle("Stop Microservice");
    fireEvent.click(stopButton);
    expect(mockOnStop).toHaveBeenCalledWith(mockMicroservices[1]);
  });
});
