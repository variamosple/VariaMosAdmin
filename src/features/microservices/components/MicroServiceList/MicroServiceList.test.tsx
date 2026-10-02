import { render, screen } from "@testing-library/react";
import type React from "react";
import { ToastProvider } from "@/shared/context/ToastContext";
import type { MicroService } from "../../domain/Entity/MicroService";
import { MicroServiceList } from "./index";

vi.mock("@variamosple/variamos-components", () => ({
  Paginator: () => <div data-testid="paginator">Paginator</div>,
}));

vi.mock("@patternfly/react-log-viewer", () => ({
  LogViewer: ({ data }: { data: string }) => <div>{data}</div>,
}));

describe("MicroServiceList", () => {
  const mockMicroServices: MicroService[] = [
    {
      serviceName: "service-1",
      displayName: "Service 1",
      health: {
        status: "UP",
        serviceName: "service-1",
        responseTimeMs: 30,
        checkedAt: new Date().toISOString(),
      },
      replicasCount: 1,
      containers: [],
    },
    {
      serviceName: "service-2",
      displayName: "Service 2",
      health: {
        status: "DOWN",
        serviceName: "service-2",
        responseTimeMs: 0,
        checkedAt: new Date().toISOString(),
      },
      replicasCount: 0,
      containers: [],
    },
  ];

  const defaultProps = {
    items: mockMicroServices,
    currentPage: 1,
    totalPages: 2,
    onPageChange: vi.fn(),
    onMicroServiceStart: vi.fn(),
    onMicroServiceRestart: vi.fn(),
    onMicroServiceStop: vi.fn(),
    onMicroServiceScale: vi.fn(),
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("renders list of microservices correctly", () => {
    renderWithProviders(<MicroServiceList {...defaultProps} />);
    expect(screen.getByText("Service 1")).toBeInTheDocument();
    expect(screen.getByText("Service 2")).toBeInTheDocument();
  });
});
