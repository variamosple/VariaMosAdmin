import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { RoleDetailsPage } from "./RoleDetails";

// Mock router hooks & params
const mockNavigate = vi.fn();
const mockParams = { roleId: "123" };

// Mock react-bootstrap Spinner
vi.mock("react-bootstrap", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-bootstrap")>();
  return {
    ...original,
    Spinner: () => <div data-testid="loading-spinner">Spinner</div>,
  };
});

vi.mock("react-router-dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...original,
    useParams: () => mockParams,
  };
});

// Mock ToastContext
const mockPushToast = vi.fn();
const mockRemoveToast = vi.fn();
vi.mock("@/shared/context/ToastContext", async () => ({
  useToast: () => ({
    pushToast: mockPushToast,
    removeToast: mockRemoveToast,
  }),
}));

// Mock @variamosple/variamos-components
const mockLoadData = vi.fn();
const mockOnPageChange = vi.fn();
vi.mock("@variamosple/variamos-components", async () => {
  return {
    withPageVisit: <T,>(component: T): T => component,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
    usePaginatedQuery: vi.fn(),
    useDebouncedValue: <T,>(val: T): [T] => [val],
    Paginator: () => <div data-testid="paginator" />,
    ResponseModel: class ResponseModel<T> {
      errorCode?: number | null = null;
      message?: string;
      data?: T;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
    PagedModel: class PagedModel {},
  };
});

// Mock sub-components
vi.mock(
  "@/features/role-management/components/RolePermissionForm",
  async () => ({
    RolePermissionForm: ({
      onRolePermissionSubmit,
      isLoading,
    }: {
      onRolePermissionSubmit: (payload: { permissionId: number }) => void;
      isLoading: boolean;
    }) => (
      <div data-testid="role-permission-form">
        <button
          type="button"
          onClick={() => onRolePermissionSubmit({ permissionId: 42 })}
          disabled={isLoading}
        >
          Add permission
        </button>
      </div>
    ),
  }),
);

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("RoleDetailsPage Component", () => {
  const usePaginatedQueryMock = usePaginatedQuery as import("vitest").Mock;

  const mockPermissions = [
    { id: 1, name: "READ_PRIVILEGES" },
    { id: 2, name: "WRITE_PRIVILEGES" },
  ];

  let resolveRolePromise: (value: Response) => void;
  let delayRoleQuery = false;
  let createRolePermissionCalled = 0;
  let deleteRolePermissionCalled = 0;
  let createRolePermissionPayload: {
    permissionId: number;
    roleId: number;
  } | null = null;
  let deleteRolePermissionParams: Record<
    string,
    string | readonly string[] | undefined
  > | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
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
      http.post(
        apiTarget("/v1/roles/:roleId/permissions"),
        async ({ request }) => {
          createRolePermissionCalled++;
          createRolePermissionPayload = (await request.json()) as {
            permissionId: number;
            roleId: number;
          };
          return HttpResponse.json({ data: createRolePermissionPayload });
        },
      ),
      http.delete(
        apiTarget("/v1/roles/:roleId/permissions/:permissionId"),
        ({ params }) => {
          deleteRolePermissionCalled++;
          deleteRolePermissionParams = params;
          return HttpResponse.json({ errorCode: null });
        },
      ),
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

    const backButton = screen.getByRole("button", {
      name: /Back to role list/i,
    });
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
    expect(createRolePermissionPayload).toEqual({
      permissionId: 42,
      roleId: 123,
    });
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission assignment",
        variant: "success",
      }),
    );
  });

  it("shows the refusal of a permission assignment in a danger toast", async () => {
    server.use(
      http.post(apiTarget("/v1/roles/:roleId/permissions"), () =>
        HttpResponse.json(
          { errorCode: 409, message: "The role already has this permission" },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();

    render(<RoleDetailsPage />);
    expect(await screen.findByText("Admin Role")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add permission/i }));

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith({
        title: "Permission assignment",
        message: "The role already has this permission",
        variant: "danger",
      });
    });
    expect(mockPushToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" }),
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
      screen.getByRole("dialog", { name: "Remove permission" }),
    ).toHaveTextContent(
      'Remove the permission "READ_PRIVILEGES" from the role "Admin"?',
    );

    // Confirm with the action button
    const confirmButton = screen.getByRole("button", {
      name: "Remove permission",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteRolePermissionCalled).toBe(1);
    });
    expect(deleteRolePermissionParams).toEqual(
      expect.objectContaining({ roleId: "123", permissionId: "1" }),
    );
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Permission removal",
        variant: "success",
      }),
    );
  });

  it("says the role does not exist instead of a bare title (UX-24)", async () => {
    // The API answers a missing role with a success without data
    server.use(
      http.get(apiTarget("/v1/roles/:roleId"), () =>
        HttpResponse.json({ errorCode: null, data: null }),
      ),
    );
    render(<RoleDetailsPage />);

    expect(
      await screen.findByText("This role does not exist, or it was deleted."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Role$/,
    );
    expect(
      screen.queryByTestId("role-permission-form"),
    ).not.toBeInTheDocument();
  });

  it("offers Retry when the role could not be read", async () => {
    let calls = 0;
    server.use(
      http.get(apiTarget("/v1/roles/:roleId"), () => {
        calls++;
        return calls === 1
          ? HttpResponse.json({ errorCode: "SYSTEM_ERROR" }, { status: 500 })
          : HttpResponse.json({
              errorCode: null,
              data: { id: 123, name: "Admin" },
            });
      }),
    );
    render(<RoleDetailsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", { name: "Admin Role" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("role-permission-form")).toBeInTheDocument();
  });
});
