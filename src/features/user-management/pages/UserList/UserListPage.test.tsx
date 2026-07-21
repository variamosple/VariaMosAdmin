import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserListPage } from "./index";
import { ToastProvider } from "@/shared/context/ToastContext";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";

const mockNavigate = jest.fn();

// Mock @variamosple/variamos-components to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => {
  const React = require("react");
  const { useState, useCallback } = React;
  return {
    withPageVisit: (component: any) => component,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
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
    useQuery: ({ queryFunction, initialFilter }: any) => {
      const [data, setData] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [isLoaded, setIsLoaded] = useState(false);

      const loadData = useCallback(
        async (filter: any) => {
          setIsLoading(true);
          const response = await queryFunction(filter);
          if (!response.errorCode) {
            setData(response.data || []);
            setIsLoaded(true);
          }
          setIsLoading(false);
          return response;
        },
        [queryFunction],
      );

      return {
        loadData,
        isLoading,
        data,
        filter: initialFilter,
        isLoaded,
      };
    },
  };
});

describe("UserListPage Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    server.use(
      http.get("*/v1/users", () => {
        return HttpResponse.json({
          data: [
            {
              id: "1",
              user: "admin_user",
              name: "Admin User",
              email: "admin@variamos.com",
              isEnabled: true,
              isDeleted: false,
              createdAt: "2026-07-20T22:00:00.000Z",
            },
            {
              id: "2",
              user: "normal_user",
              name: "Normal User",
              email: "user@variamos.com",
              isEnabled: false,
              isDeleted: false,
              createdAt: "2026-07-20T22:00:00.000Z",
            },
          ],
        });
      }),
      http.get("*/v1/users/:userId/roles/details", () => {
        return HttpResponse.json({
          data: [{ id: 1, name: "Admin", permissions: [{ id: 10, name: "READ_PRIVILEGES" }] }],
        });
      }),
      http.post("*/v1/users/:userId/recovery-link", () => {
        return HttpResponse.json({
          data: { recoveryUrl: "http://recovery-url-test" },
        });
      }),
      http.put("*/v1/users/:userId/disable", () => {
        return HttpResponse.json({ data: null });
      }),
      http.put("*/v1/users/:userId/enable", () => {
        return HttpResponse.json({ data: null });
      }),
      http.delete("*/v1/users/:userId", () => {
        return HttpResponse.json({ data: null });
      }),
    );
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it("renders page components correctly", async () => {
    renderWithProviders(<UserListPage />);
    expect(screen.getByText("Users list")).toBeInTheDocument();

    // Wait for the MSW handlers to return users
    expect(await screen.findByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Normal User")).toBeInTheDocument();
  });

  it("renders RecoveryLinkModal when reset link button is clicked and user generates link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserListPage />);
    expect(await screen.findByText("Admin User")).toBeInTheDocument();

    // Click Reset Password key icon for Admin User (first active user)
    const resetKeyButtons = screen.getAllByTitle("Generate password reset link");
    await user.click(resetKeyButtons[0]);

    // Modal should show
    expect(screen.getByText("Generate Recovery Link")).toBeInTheDocument();

    // Click generate button
    const generateBtn = screen.getByRole("button", { name: "Generate Secure Link" });
    await user.click(generateBtn);

    // Wait for link generation to output the value
    expect(await screen.findByDisplayValue("http://recovery-url-test")).toBeInTheDocument();

    // Close modal
    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    await user.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText("Generate Recovery Link")).not.toBeInTheDocument();
    });
  });

  it("renders and handles disable confirmation modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserListPage />);
    expect(await screen.findByText("Admin User")).toBeInTheDocument();

    // Click disable button (Ban icon)
    const disableButtons = screen.getAllByTitle("Disable user");
    await user.click(disableButtons[0]);

    expect(screen.getByText("Are you sure you want to disable the user?")).toBeInTheDocument();

    // Confirm (Accept button)
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Verify modal closes
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to disable the user?"),
      ).not.toBeInTheDocument();
    });
  });

  it("renders and handles enable confirmation modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserListPage />);
    expect(await screen.findByText("Normal User")).toBeInTheDocument();

    // Click enable button (CheckCircle icon - only available on disabled users)
    const enableButtons = screen.getAllByTitle("Enable user");
    await user.click(enableButtons[0]);

    expect(screen.getByText("Are you sure you want to enable the user?")).toBeInTheDocument();

    // Confirm (Accept button)
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Verify modal closes
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to enable the user?"),
      ).not.toBeInTheDocument();
    });
  });

  it("renders and handles delete confirmation modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserListPage />);
    expect(await screen.findByText("Admin User")).toBeInTheDocument();

    // Click delete user button (Trash icon)
    const deleteButtons = screen.getAllByTitle("Delete user");
    await user.click(deleteButtons[0]);

    expect(screen.getByText("Are you sure you want to delete the user?")).toBeInTheDocument();

    // Confirm (Accept button)
    await user.click(screen.getByRole("button", { name: "Accept" }));

    // Verify modal closes
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to delete the user?"),
      ).not.toBeInTheDocument();
    });
  });

  it("displays empty list when API returns no users", async () => {
    server.use(
      http.get("*/v1/users", () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    renderWithProviders(<UserListPage />);
    expect(screen.getByText("Users list")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Admin User")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Normal User")).not.toBeInTheDocument();
  });

  it("shows error toast when API fails to load users", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/v1/users", () => {
        return HttpResponse.json(
          { errorCode: 500, message: "Network/communication error." },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<UserListPage />);
    expect(await screen.findByText("User query error")).toBeInTheDocument();
    expect(screen.getByText("Network/communication error.")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
