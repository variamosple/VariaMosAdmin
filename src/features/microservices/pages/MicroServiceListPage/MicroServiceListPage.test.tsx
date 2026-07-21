import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MicroServiceListPage } from "./index";
import { ToastProvider } from "@/shared/context/ToastContext";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";

// Mock @variamosple/variamos-components to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  const React = require("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: (component: any) => component,
    PagedModel: class PagedModel {},
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
    Paginator: () => <div data-testid="paginator">Paginator</div>,
    usePaginatedQuery: ({ queryFunction, initialFilter }: any) => {
      const [data, setData] = useState([]);
      const [currentPage, setCurrentPage] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [isLoading, setIsLoading] = useState(false);

      const loadData = useCallback(
        async (filter: any) => {
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
jest.mock("@patternfly/react-log-viewer", () => {
  return {
    LogViewer: ({ data }: { data: string }) => <div data-testid="log-viewer">{data}</div>,
  };
});

describe("MicroServiceListPage Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

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
        screen.queryByText("Are you sure you want to restart the microservice?"),
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

    expect(screen.getByText("Are you sure you want to stop the microservice?")).toBeInTheDocument();

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
