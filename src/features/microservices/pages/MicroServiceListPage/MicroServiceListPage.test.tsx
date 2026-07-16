import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MicroServiceListPage } from "./index";
import { useMicroServiceList } from "../../hooks/useMicroServiceList";

// Mock @variamosple/variamos-components completely to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  return {
    withPageVisit: (component: any) => component,
    PagedModel: class PagedModel {},
    ResponseModel: class ResponseModel {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };
});

// Mock useMicroServiceList hook
jest.mock("../../hooks/useMicroServiceList");

// Mock MicroServiceList sub-component
jest.mock("../../components/MicroServiceList", () => ({
  MicroServiceList: ({ onMicroServiceStart, onMicroServiceRestart, onMicroServiceStop }: any) => (
    <div>
      <button onClick={() => onMicroServiceStart("service-a")}>Start Service A</button>
      <button onClick={() => onMicroServiceRestart("service-b")}>Restart Service B</button>
      <button onClick={() => onMicroServiceStop("service-c")}>Stop Service C</button>
    </div>
  ),
}));

// Mock ConfirmationModal
jest.mock("@/shared/components/ConfirmationModal", () => ({
  __esModule: true,
  default: ({ show, message, onConfirm, onCancel }: any) => {
    if (!show) return null;
    return (
      <div data-testid="confirmation-modal">
        <span>{message}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  },
}));

describe("MicroServiceListPage", () => {
  const mockPerformStart = jest.fn();
  const mockPerformRestart = jest.fn();
  const mockPerformStop = jest.fn();
  const mockSetShowStart = jest.fn();
  const mockSetShowRestart = jest.fn();
  const mockSetShowStop = jest.fn();
  const mockSetToStart = jest.fn();
  const mockSetToRestart = jest.fn();

  const baseHookState = {
    showStart: false,
    setShowStart: mockSetShowStart,
    showRestart: false,
    setShowRestart: mockSetShowRestart,
    showStop: false,
    setShowStop: mockSetShowStop,
    toStartMicroService: null,
    setToStartMicroService: mockSetToStart,
    toRestartMicroService: null,
    setToRestartMicroService: mockSetToRestart,
    toStopMicroService: null,
    microServices: [],
    currentPage: 1,
    totalPages: 1,
    onPageChange: jest.fn(),
    onMicroServiceStart: jest.fn(),
    performMicroSerViceStart: mockPerformStart,
    onMicroServiceRestart: jest.fn(),
    performMicroSerViceRestart: mockPerformRestart,
    onMicroServiceStop: jest.fn(),
    performMicroSerViceStop: mockPerformStop,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("orchestrates the Start confirmation modal triggers correctly", () => {
    (useMicroServiceList as jest.Mock).mockReturnValue({
      ...baseHookState,
      showStart: true,
      toStartMicroService: "service-a",
    });

    render(<MicroServiceListPage />);

    expect(screen.getByText("Are you sure you want to start the microservice?")).toBeDefined();

    // Test Confirm click
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockPerformStart).toHaveBeenCalledWith("service-a");
    expect(mockSetShowStart).toHaveBeenCalledWith(false);

    // Test Cancel click
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockSetToStart).toHaveBeenCalledWith(undefined);
    expect(mockSetShowStart).toHaveBeenCalledWith(false);
  });

  it("orchestrates the Restart confirmation modal triggers correctly", () => {
    (useMicroServiceList as jest.Mock).mockReturnValue({
      ...baseHookState,
      showRestart: true,
      toRestartMicroService: "service-b",
    });

    render(<MicroServiceListPage />);

    expect(screen.getByText("Are you sure you want to restart the microservice?")).toBeDefined();

    // Confirm click
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockPerformRestart).toHaveBeenCalledWith("service-b");
    expect(mockSetShowRestart).toHaveBeenCalledWith(false);

    // Cancel click
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockSetToRestart).toHaveBeenCalledWith(undefined);
    expect(mockSetShowRestart).toHaveBeenCalledWith(false);
  });

  it("orchestrates the Stop confirmation modal triggers correctly", () => {
    (useMicroServiceList as jest.Mock).mockReturnValue({
      ...baseHookState,
      showStop: true,
      toStopMicroService: "service-c",
    });

    render(<MicroServiceListPage />);

    expect(screen.getByText("Are you sure you want to stop the microservice?")).toBeDefined();

    // Confirm click
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockPerformStop).toHaveBeenCalledWith("service-c");
    expect(mockSetShowStop).toHaveBeenCalledWith(false);

    // Cancel click
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockSetToRestart).toHaveBeenCalledWith(undefined);
    expect(mockSetShowStop).toHaveBeenCalledWith(false);
  });
});
