import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { UserDetailsPage } from "./UserDetails";
import { usePaginatedQuery, useRouter } from "@variamosple/variamos-components";
import { useParams } from "react-router-dom";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

// Mock router-related hooks & components
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

const mockPushToast = jest.fn();
const mockRemoveToast = jest.fn();
jest.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({
    pushToast: mockPushToast,
    removeToast: mockRemoveToast,
  }),
}));

// Mock @variamosple/variamos-components completely
jest.mock("@variamosple/variamos-components", () => {
  return {
    withPageVisit: (component: any) => component,
    useRouter: jest.fn(),
    usePaginatedQuery: jest.fn(),
    PagedModel: class PagedModel {
      pageNumber?: number;
      pageSize?: number;
      constructor(p?: number, s?: number) {
        this.pageNumber = p;
        this.pageSize = s;
      }
    },
    ResponseModel: class ResponseModel {
      errorCode?: number | null;
      message?: string;
      constructor(code?: number | null, msg?: string) {
        this.errorCode = code;
        this.message = msg;
      }
    },
  };
});

// Mock react-bootstrap components
jest.mock("react-bootstrap", () => {
  const original = jest.requireActual("react-bootstrap");
  return {
    ...original,
    Spinner: (props: any) => <div data-testid="spinner" {...props} />,
  };
});

// Mock sub-components
jest.mock("@/features/user-management/components/UserDetails", () => ({
  UserDetails: ({ user }: any) => <div data-testid="user-details">User: {user?.name}</div>,
}));

jest.mock("../components/UserRoleForm", () => ({
  UserRoleForm: ({ onUserRoleSubmit, isLoading }: any) => (
    <div data-testid="user-role-form">
      <span>Role Form (Loading: {isLoading ? "true" : "false"})</span>
      <button onClick={() => onUserRoleSubmit({ roleId: "admin-role" })}>Assign Role</button>
    </div>
  ),
}));

jest.mock("../components/UserRoleList", () => ({
  UserRoleList: ({ items, onRoleDelete }: any) => (
    <div data-testid="user-role-list">
      {items?.map((item: any) => (
        <div key={item.id} data-testid={`role-row-${item.id}`}>
          {item.name}
          <button onClick={() => onRoleDelete(item)}>Delete {item.name}</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/shared/components/ConfirmationModal", () => {
  return {
    __esModule: true,
    default: ({ show, message, onConfirm, onCancel }: any) => {
      if (!show) return null;
      return (
        <div data-testid="confirmation-modal">
          <span>{message}</span>
          <button onClick={onConfirm}>Confirm Action</button>
          <button onClick={onCancel}>Cancel Action</button>
        </div>
      );
    },
  };
});

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("UserDetailsPage Component", () => {
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;
  const useRouterMock = useRouter as jest.Mock;
  const useParamsMock = useParams as jest.Mock;

  const mockNavigate = jest.fn();
  const mockLoadUserRoles = jest.fn();
  const mockOnUserRolesPageChange = jest.fn();

  const basePaginatedState = {
    data: [{ id: "role-1", name: "Administrator" }],
    currentPage: 1,
    loadData: mockLoadUserRoles,
    totalPages: 1,
    filter: {},
    onPageChange: mockOnUserRolesPageChange,
  };

  let resolveUserPromise: any;
  let delayUserQuery = false;
  let createUserRoleCalled = 0;
  let deleteUserRoleCalled = 0;
  let createUserRolePayload: any = null;
  let deleteUserRoleParams: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    delayUserQuery = false;
    createUserRoleCalled = 0;
    deleteUserRoleCalled = 0;
    createUserRolePayload = null;
    deleteUserRoleParams = null;

    useParamsMock.mockReturnValue({ userId: "user-123" });
    useRouterMock.mockReturnValue({ navigate: mockNavigate });
    usePaginatedQueryMock.mockReturnValue(basePaginatedState);

    server.use(
      http.get(apiTarget("/v1/users/:userId"), () => {
        if (delayUserQuery) {
          return new Promise((resolve) => {
            resolveUserPromise = resolve;
          });
        }
        return HttpResponse.json({
          data: { id: "user-123", name: "John Doe", email: "john@doe.com" },
        });
      }),
      http.post(apiTarget("/v1/users/:userId/roles"), async ({ request }) => {
        createUserRoleCalled++;
        createUserRolePayload = await request.json();
        return HttpResponse.json({ errorCode: null });
      }),
      http.delete(apiTarget("/v1/users/:userId/roles/:roleId"), ({ params }) => {
        deleteUserRoleCalled++;
        deleteUserRoleParams = params;
        return HttpResponse.json({ errorCode: null });
      }),
    );
  });

  it("renders loader initially if details are loading", async () => {
    delayUserQuery = true;
    render(<UserDetailsPage />);
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();

    // Clean up
    await act(async () => {
      resolveUserPromise(
        HttpResponse.json({
          data: { id: "user-123", name: "John Doe", email: "john@doe.com" },
        }),
      );
    });
  });

  it("renders user information and role components correctly", async () => {
    render(<UserDetailsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("user-details")).toHaveTextContent("User: John Doe");
    });

    expect(screen.getByTestId("user-role-form")).toBeInTheDocument();
    expect(screen.getByTestId("user-role-list")).toBeInTheDocument();
    expect(screen.getByTestId("role-row-role-1")).toHaveTextContent("Administrator");
  });

  it("handles back to user list click", async () => {
    const user = userEvent.setup();
    render(<UserDetailsPage />);

    const backBtn = await screen.findByRole("button", { name: /back to user list/i });
    await user.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/users");
  });

  it("handles role assignment successfully", async () => {
    const user = userEvent.setup();
    render(<UserDetailsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("user-details")).toBeInTheDocument();
    });

    const assignBtn = screen.getByRole("button", { name: /assign role/i });
    await user.click(assignBtn);

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Role assignment" }),
    );
    await waitFor(() => {
      expect(createUserRoleCalled).toBe(1);
    });
    expect(createUserRolePayload).toEqual({ roleId: "admin-role", userId: "user-123" });
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Role assignment", variant: "success" }),
    );
  });

  it("handles role deletion confirmation & perform deletion", async () => {
    const user = userEvent.setup();
    render(<UserDetailsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("role-row-role-1")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /delete administrator/i });
    await user.click(deleteBtn);

    expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to remove the user role?")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /confirm action/i });
    await user.click(confirmBtn);

    expect(mockPushToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Role delete" }));
    await waitFor(() => {
      expect(deleteUserRoleCalled).toBe(1);
    });
    expect(deleteUserRoleParams).toEqual(
      expect.objectContaining({ userId: "user-123", roleId: "role-1" }),
    );
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Role delete", variant: "success" }),
    );
    expect(mockOnUserRolesPageChange).toHaveBeenCalledWith(1);
  });
});
