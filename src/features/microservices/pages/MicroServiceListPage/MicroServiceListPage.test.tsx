import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type React from "react";
import { ToastProvider } from "@/shared/context/ToastContext";
import { server } from "@/shared/tests/mocks/server";
import { MicroServiceListPage } from "./index";

// Mock @variamosple/variamos-components to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  const React = await import("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: <T,>(component: T): T => component,
    PagedModel: class PagedModel {},
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
    Paginator: () => <div data-testid="paginator">Paginator</div>,
    usePaginatedQuery: <T, F>({
      queryFunction,
      initialFilter,
    }: {
      queryFunction: (filter: F) => Promise<{
        errorCode?: number;
        message?: string;
        data?: T[];
        type: string;
      }>;
      initialFilter: F;
    }) => {
      const [data, setData] = useState<T[]>([]);
      const [currentPage, setCurrentPage] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [isLoading, setIsLoading] = useState(false);

      const loadData = useCallback(
        async (filter: F) => {
          setIsLoading(true);
          const response = await queryFunction(filter);
          if (!response.errorCode) {
            setData(response.data || []);
            setTotalPages(1);
          }
          setIsLoading(false);
          return response;
        },
        [queryFunction],
      );

      const onPageChange = useCallback(
        (page: number) => {
          setCurrentPage(page);
          loadData({ ...initialFilter, page });
        },
        [loadData, initialFilter],
      );

      return {
        data,
        currentPage,
        loadData,
        isLoading,
        totalPages,
        onPageChange,
      };
    },
  };
});

// Mock patternfly log viewer to prevent Jest ESM syntax errors
vi.mock("@patternfly/react-log-viewer", async () => {
  return {
    LogViewer: ({ data }: { data: string }) => (
      <div data-testid="log-viewer">{data}</div>
    ),
  };
});

describe("MicroServiceListPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    server.use(
      http.get("*/v1/micro-services", () => {
        return HttpResponse.json({
          data: [
            {
              serviceName: "service-a",
              displayName: "Service A",
              health: {
                status: "UP",
                serviceName: "service-a",
                responseTimeMs: 25,
                checkedAt: new Date().toISOString(),
              },
              replicasCount: 1,
              containers: [
                {
                  id: "c-1",
                  name: "service-a",
                  state: "running",
                  status: "up",
                  created: new Date(),
                  labels: {},
                },
              ],
            },
            {
              serviceName: "service-b",
              displayName: "Service B",
              health: {
                status: "DOWN",
                serviceName: "service-b",
                responseTimeMs: 0,
                checkedAt: new Date().toISOString(),
              },
              replicasCount: 0,
              containers: [
                {
                  id: "c-2",
                  name: "service-b",
                  state: "exited",
                  status: "down",
                  created: new Date(),
                  labels: {},
                },
              ],
            },
          ],
        });
      }),
      http.put("*/v1/micro-services/:microserviceId/start", () => {
        return HttpResponse.json({ data: null });
      }),
      http.put("*/v1/micro-services/:microserviceId/restart", () => {
        return HttpResponse.json({ data: null });
      }),
      http.put("*/v1/micro-services/:microserviceId/stop", () => {
        return HttpResponse.json({ data: null });
      }),
    );
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("renders page header and list of microservices correctly", async () => {
    renderWithProviders(<MicroServiceListPage />);
    expect(
      screen.getByRole("heading", { name: "Microservices & System Status" }),
    ).toBeInTheDocument();

    // Wait for MSW responses
    expect(await screen.findByText("Service A")).toBeInTheDocument();
    expect(screen.getByText("Service B")).toBeInTheDocument();
  });

  it("handles start microservice action correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MicroServiceListPage />);
    expect(await screen.findByText("Service B")).toBeInTheDocument();

    // Click Start Microservice button for Service B
    const startButton = screen.getByTitle("Start Service");
    await user.click(startButton);

    // Modal should be visible
    expect(
      screen.getByText("Are you sure you want to start Service B?"),
    ).toBeInTheDocument();

    // Confirm action (Button label in ConfirmationModal is Accept)
    const confirmButton = screen.getByRole("button", {
      name: /accept|confirm|yes/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to start Service B?"),
      ).not.toBeInTheDocument();
    });
  });

  it("handles restart microservice action correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    // Click Restart Microservice button for Service A
    const restartButton = screen.getByTitle("Restart Service");
    await user.click(restartButton);

    // Modal should be visible
    expect(
      screen.getByText("Are you sure you want to restart Service A?"),
    ).toBeInTheDocument();

    // Confirm action
    const confirmButton = screen.getByRole("button", {
      name: /accept|confirm|yes/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to restart Service A?"),
      ).not.toBeInTheDocument();
    });
  });

  it("handles stop microservice action correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    // Click Stop Microservice button for Service A
    const stopButton = screen.getByTitle("Stop Service");
    await user.click(stopButton);

    // Modal should be visible
    expect(
      screen.getByText("Are you sure you want to stop Service A?"),
    ).toBeInTheDocument();

    // Confirm action
    const confirmButton = screen.getByRole("button", {
      name: /accept|confirm|yes/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to stop Service A?"),
      ).not.toBeInTheDocument();
    });
  });
});
