import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/shared/tests/mocks/server";
import { renderPage } from "@/shared/tests/render";
import { MicroServiceListPage } from "./index";

// The permissions of the signed-in user, changed by the tests
const session = vi.hoisted(() => ({ permissions: [] as string[] }));

// Mock @variamosple/variamos-components to avoid ESM import errors
vi.mock("@variamosple/variamos-components", async () => {
  const React = await import("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: <T,>(component: T): T => component,
    useSession: () => ({ user: { permissions: session.permissions } }),
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
            setData(response.data ?? []);
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
    session.permissions = [];

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

  it("renders page header and list of microservices correctly", async () => {
    renderPage(<MicroServiceListPage />);
    expect(
      screen.getByRole("heading", { name: "Microservices & System Status" }),
    ).toBeInTheDocument();

    // Wait for MSW responses
    expect(await screen.findByText("Service A")).toBeInTheDocument();
    expect(screen.getByText("Service B")).toBeInTheDocument();
  });

  it("handles start microservice action correctly", async () => {
    const { user } = renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service B")).toBeInTheDocument();

    // Click Start Microservice button for Service B
    const startButton = screen.getByTitle("Start Service");
    await user.click(startButton);

    // Modal should be visible
    expect(screen.getByText("Start Service B?")).toBeInTheDocument();

    // Confirm with the action button
    const confirmButton = screen.getByRole("button", {
      name: "Start microservice",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText("Start Service B?")).not.toBeInTheDocument();
    });
  });

  it("handles restart microservice action correctly", async () => {
    const { user } = renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    // Click Restart Microservice button for Service A
    const restartButton = screen.getByTitle("Restart Service");
    await user.click(restartButton);

    // Modal should be visible
    expect(screen.getByText("Restart Service A?")).toBeInTheDocument();

    // Confirm action
    const confirmButton = screen.getByRole("button", {
      name: "Restart microservice",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText("Restart Service A?")).not.toBeInTheDocument();
    });
  });

  it("handles stop microservice action correctly", async () => {
    const { user } = renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    // Click Stop Microservice button for Service A
    const stopButton = screen.getByTitle("Stop Service");
    await user.click(stopButton);

    // Modal should be visible
    expect(screen.getByText("Stop Service A?")).toBeInTheDocument();

    // Confirm action
    const confirmButton = screen.getByRole("button", {
      name: "Stop microservice",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText("Stop Service A?")).not.toBeInTheDocument();
    });
  });

  it("keeps the last statuses and says the connection is lost when a reload fails", async () => {
    const { user } = renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    server.use(
      http.post("*/v1/micro-services/check", () =>
        HttpResponse.json({ data: null }),
      ),
      http.get("*/v1/micro-services", () =>
        HttpResponse.json(
          { errorCode: 500, message: "Service unavailable." },
          { status: 500 },
        ),
      ),
    );
    await user.click(screen.getByRole("button", { name: /Refresh/ }));

    expect(
      await screen.findByText(/Connection to the administration service lost/),
    ).toBeInTheDocument();
    expect(screen.getByText("Service A")).toBeInTheDocument();
  });

  it("says why an action failed", async () => {
    server.use(
      http.put("*/v1/micro-services/:microserviceId/stop", () =>
        HttpResponse.json(
          { errorCode: 500, message: "Failed to stop microservice container" },
          { status: 500 },
        ),
      ),
    );
    const { user } = renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    await user.click(screen.getByTitle("Stop Service"));
    await user.click(screen.getByRole("button", { name: "Stop microservice" }));

    expect(
      await screen.findByText("Service A could not be stopped"),
    ).toBeInTheDocument();
  });

  it("shows the state of the nightly database backup (EV-86)", async () => {
    server.use(
      http.get("*/v1/backups/status", () =>
        HttpResponse.json({
          data: {
            configured: true,
            status: {
              file: "db_backup.sql.gz",
              createdAt: new Date().toISOString(),
              sizeBytes: 69087000,
            },
            problems: [],
          },
        }),
      ),
    );
    renderPage(<MicroServiceListPage />);

    expect(
      await screen.findByText(
        "Last database backup: less than an hour ago, 65.9 MB, intact.",
      ),
    ).toBeInTheDocument();
  });

  it("warns about a backup problem", async () => {
    server.use(
      http.get("*/v1/backups/status", () =>
        HttpResponse.json({
          data: {
            configured: true,
            status: null,
            problems: [{ kind: "status-missing", message: "Unreadable." }],
          },
        }),
      ),
    );
    renderPage(<MicroServiceListPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database backup: Unreadable.",
    );
  });

  it("offers no announcement without the right to send one", async () => {
    renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    expect(screen.queryByTitle("Announce maintenance")).not.toBeInTheDocument();
  });

  it("suggests a maintenance announcement for the service of the row (EV-86)", async () => {
    session.permissions = ["admin::notifications::dispatch"];
    const { user } = renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    const [first] = screen.getAllByTitle("Announce maintenance");
    await user.click(first as HTMLElement);

    expect(
      await screen.findByRole("heading", { name: "Announce a maintenance?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Maintenance: Service A"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveDisplayValue(
      /^Service A will restart at \d{2}:\d{2} UTC/,
    );
  });

  it("reminds whoever may announce it before a restart", async () => {
    session.permissions = ["admin::notifications::dispatch"];
    const { user } = renderPage(<MicroServiceListPage />);
    expect(await screen.findByText("Service A")).toBeInTheDocument();

    await user.click(screen.getByTitle("Restart Service"));

    expect(
      screen.getByText(
        'Restart Service A? Users working in it can be warned first with "Announce maintenance" on its row.',
      ),
    ).toBeInTheDocument();
  });
});
