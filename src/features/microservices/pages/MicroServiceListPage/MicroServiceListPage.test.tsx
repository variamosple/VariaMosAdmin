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
              id: "service-a",
              names: ["Service A"],
              state: "running",
              status: "up",
              created: "2026-07-20T22:00:00.000Z",
            },
            {
              id: "service-b",
              names: ["Service B"],
              state: "exited",
              status: "down",
              created: "2026-07-20T22:00:00.000Z",
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
      screen.getByRole("heading", { name: "Monitoring - Microservices list" }),
    ).toBeInTheDocument();

    // Wait for MSW responses
    expect(await screen.findByText("Service A")).toBeInTheDocument();
    expect(screen.getByText("Service B")).toBeInTheDocument();
  });

  it("orchestrates the Start confirmation modal triggers correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MicroServiceListPage />);
    expect(await screen.findByText("Service B")).toBeInTheDocument();

    // Click Start Microservice button for Service B (running play fill icon)
    const startBtn = screen.getByTitle("Start Microservice");
    await user.click(startBtn);

    expect(
      screen.getByText("Are you sure you want to start the microservice?"),
    ).toBeInTheDocument();

    // Test Confirm click (Accept button)
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Modal should close
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to start the microservice?"),
      ).not.toBeInTheDocument();
    });
  });

  it("orchestrates the Restart confirmation modal triggers correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    // Click Restart Microservice button for Service A
    const restartBtn = screen.getByTitle("Restart Microservice");
    await user.click(restartBtn);

    expect(
      screen.getByText("Are you sure you want to restart the microservice?"),
    ).toBeInTheDocument();

    // Confirm click (Accept button)
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Modal should close
    await waitFor(() => {
      expect(
        screen.queryByText(
          "Are you sure you want to restart the microservice?",
        ),
      ).not.toBeInTheDocument();
    });
  });

  it("orchestrates the Stop confirmation modal triggers correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    // Click Stop Microservice button for Service A
    const stopBtn = screen.getByTitle("Stop Microservice");
    await user.click(stopBtn);

    expect(
      screen.getByText("Are you sure you want to stop the microservice?"),
    ).toBeInTheDocument();

    // Confirm click (Accept button)
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Modal should close
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to stop the microservice?"),
      ).not.toBeInTheDocument();
    });
  });
});
