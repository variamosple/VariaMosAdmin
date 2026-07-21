import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { RoleDetailsPage } from "./RoleDetails";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

// Mock router hooks & params
const mockNavigate = jest.fn();
const mockParams = { roleId: "123" };

// Mock react-bootstrap Spinner
jest.mock("react-bootstrap", () => {
  const original = jest.requireActual("react-bootstrap");
  return {
    ...original,
    Spinner: () => <div data-testid="loading-spinner">Spinner</div>,
  };
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockParams,
}));

// Mock ToastContext
const mockPushToast = jest.fn();
const mockRemoveToast = jest.fn();
jest.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({
    pushToast: mockPushToast,
    removeToast: mockRemoveToast,
  }),
}));

// Mock @variamosple/variamos-components
const mockLoadData = jest.fn();
const mockOnPageChange = jest.fn();
jest.mock("@variamosple/variamos-components", () => {
  return {
    withPageVisit: (component: any) => component,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
    usePaginatedQuery: jest.fn(),
    useDebouncedValue: (val: any) => [val],
    Paginator: () => <div data-testid="paginator" />,
    ResponseModel: class ResponseModel {
      errorCode?: number | null = null;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
    PagedModel: class PagedModel {},
  };
});

// Mock sub-components
jest.mock("@/features/role-management/components/RolePermissionForm", () => ({
  RolePermissionForm: ({ onRolePermissionSubmit, isLoading }: any) => (
    <div data-testid="role-permission-form">
      <button onClick={() => onRolePermissionSubmit({ permissionId: 42 })} disabled={isLoading}>
        Add permission
      </button>
    </div>
  ),
}));

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("RoleDetailsPage Component", () => {
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  const mockPermissions = [
    { id: 1, name: "READ_PRIVILEGES" },
    { id: 2, name: "WRITE_PRIVILEGES" },
  ];

  let resolveRolePromise: any;
  let delayRoleQuery = false;
  let createRolePermissionCalled = 0;
  let deleteRolePermissionCalled = 0;
  let createRolePermissionPayload: any = null;
  let deleteRolePermissionParams: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    delayRoleQuery = false;
    createRolePermissionCalled = 0;
    deleteRolePermissionCalled = 0;
    createRolePermissionPayload = null;
    deleteRolePermissionParams = null;

    mockLoadData.mockResolvedValue({ data: [] });

    // Default mock implementation for usePaginatedQuery
    usePaginatedQueryMock.mockReturnValue({
      data: mockPermissions,
      currentPage: 1,
      loadData: mockLoadData,
      totalPages: 1,
      filter: { roleId: 123 },
      onPageChange: mockOnPageChange,
    });

    server.use(
      http.get(apiTarget("/v1/roles/:roleId"), () => {
        if (delayRoleQuery) {
          return new Promise((resolve) => {
            resolveRolePromise = resolve;
          });
        }
        return HttpResponse.json({
          errorCode: null,
          data: { id: 123, name: "Admin" },
        });
      }),
      http.post(apiTarget("/v1/roles/:roleId/permissions"), async ({ request }) => {
        createRolePermissionCalled++;
        createRolePermissionPayload = await request.json();
        return HttpResponse.json({ errorCode: null });
      }),
      http.delete(apiTarget("/v1/roles/:roleId/permissions/:permissionId"), ({ params }) => {
        deleteRolePermissionCalled++;
        deleteRolePermissionParams = params;
        return HttpResponse.json({ errorCode: null });
      }),
    );
  });

  it("renders spinner when isLoading is true", async () => {
    delayRoleQuery = true;

    render(<RoleDetailsPage />);

    expect(await screen.findByTestId("loading-spinner")).toBeInTheDocument();

    await act(async () => {
      resolveRolePromise(
        HttpResponse.json({
          errorCode: null,
          data: { id: 123, name: "Admin" },
        }),
      );
    });
  });

  it("renders page title and permission list correctly on success", async () => {
    render(<RoleDetailsPage />);

    // Wait for the query to resolve and role name to show up
    expect(await screen.findByText("Admin Role")).toBeInTheDocument();
    expect(screen.getByText("READ_PRIVILEGES")).toBeInTheDocument();
    expect(screen.getByText("WRITE_PRIVILEGES")).toBeInTheDocument();
  });

  it("navigates back to /roles when clicking Back button", async () => {
    const user = userEvent.setup();
    render(<RoleDetailsPage />);
    expect(await screen.findByText("Admin Role")).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /Back To Role List/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/roles");
  });

  it("submits a new permission assignment successfully", async () => {
    const user = userEvent.setup();

    render(<RoleDetailsPage />);
    expect(await screen.findByText("Admin Role")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Add permission/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createRolePermissionCalled).toBe(1);
    });
    expect(createRolePermissionPayload).toEqual({ permissionId: 42, roleId: 123 });
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission assignment",
        variant: "success",
      }),
    );
  });

  it("opens deletion modal and deletes a permission on confirmation", async () => {
    const user = userEvent.setup();

    render(<RoleDetailsPage />);
    expect(await screen.findByText("Admin Role")).toBeInTheDocument();

    // Trigger delete action for the first permission "READ_PRIVILEGES"
    const deleteBtn = screen.getAllByTitle("Delete role permission")[0];
    await user.click(deleteBtn);

    // Confirmation modal should be visible
    expect(
      screen.getByText("Are you sure you want to remove the role permission?"),
    ).toBeInTheDocument();

    // Click Confirm on ConfirmationModal
    const confirmButton = screen.getByRole("button", { name: /Accept/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteRolePermissionCalled).toBe(1);
    });
    expect(deleteRolePermissionParams).toEqual(
      expect.objectContaining({ roleId: "123", permissionId: "1" }),
    );
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission delete",
        variant: "success",
      }),
    );
  });
});
