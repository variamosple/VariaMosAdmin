import { render, screen, within } from "@testing-library/react";
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
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("renders list of microservices correctly", () => {
    renderWithProviders(<MicroServiceList {...defaultProps} />);
    expect(screen.getByText("Service 1")).toBeInTheDocument();
    expect(screen.getByText("Service 2")).toBeInTheDocument();
  });

  // EV-106: status shown, and actions that follow the container state
  const serviceWith = (
    name: string,
    status: MicroService["health"]["status"],
    state: "running" | "exited",
  ): MicroService => ({
    serviceName: name,
    displayName: name,
    health: { status, serviceName: name },
    replicasCount: 1,
    containers: [
      {
        id: `${name}-1`,
        name,
        state,
        status: state,
        created: new Date(),
        labels: {},
      },
    ],
  });

  const rowOf = (name: string) => {
    const row = screen.getByText(name).closest("tr");
    if (!row) throw new Error(`No row for ${name}`);
    return within(row);
  };

  it("shows a running service never checked as NO DATA, without uptime", () => {
    renderWithProviders(
      <MicroServiceList
        {...defaultProps}
        items={[serviceWith("never-checked", "NO_DATA", "running")]}
      />,
    );

    const row = rowOf("never-checked");
    expect(row.getByText("NO DATA")).toBeInTheDocument();
    expect(row.queryByText("100%")).not.toBeInTheDocument();
    expect(row.getByTitle("Restart Service")).toBeInTheDocument();
    expect(row.getByTitle("Stop Service")).toBeInTheDocument();
    expect(row.queryByTitle("Start Service")).not.toBeInTheDocument();
  });

  it("lets a running service that answers badly be restarted", () => {
    renderWithProviders(
      <MicroServiceList
        {...defaultProps}
        items={[serviceWith("failing", "DOWN", "running")]}
      />,
    );

    const row = rowOf("failing");
    expect(row.getByText("DOWN")).toBeInTheDocument();
    expect(row.getByTitle("Restart Service")).toBeInTheDocument();
  });

  it("offers to start a stopped container, whatever its last check", () => {
    renderWithProviders(
      <MicroServiceList
        {...defaultProps}
        items={[serviceWith("stopped", "UP", "exited")]}
      />,
    );

    const row = rowOf("stopped");
    expect(row.getByTitle("Start Service")).toBeInTheDocument();
    expect(row.queryByTitle("Stop Service")).not.toBeInTheDocument();
  });
});
