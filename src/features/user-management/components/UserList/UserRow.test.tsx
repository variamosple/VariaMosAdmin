import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { UserRowComponent } from "./UserRow";
import { User } from "@/features/user-management/domain/Entity/User";
import { useQuery } from "@variamosple/variamos-components";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

// Mock router and query hooks from variamos-components
const mockNavigate = jest.fn();
const mockLoadData = jest.fn();

jest.mock("@variamosple/variamos-components", () => {
  return {
    useRouter: () => ({
      navigate: mockNavigate,
    }),
    useQuery: jest.fn(),
    PagedModel: class PagedModel {
      pageNumber?: number;
      pageSize?: number;
      constructor(pageNumber?: number, pageSize?: number) {
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
      }
    },
  };
});

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("UserRowComponent", () => {
  const useQueryMock = useQuery as jest.Mock;
  const mockOnUserResetLink = jest.fn();
  const mockOnUserDisable = jest.fn();
  const mockOnUserEnable = jest.fn();
  const mockOnUserDelete = jest.fn();

  const mockUserActive: User = {
    id: "1",
    user: "john_doe",
    name: "John Doe",
    email: "john@example.com",
    isEnabled: true,
    isDeleted: false,
    createdAt: new Date("2026-07-17T12:00:00Z"),
    lastLogin: new Date("2026-07-17T14:00:00Z"),
  };

  const defaultProps = {
    onUserResetLink: mockOnUserResetLink,
    onUserDisable: mockOnUserDisable,
    onUserEnable: mockOnUserEnable,
    onUserDelete: mockOnUserDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useQueryMock.mockReturnValue({
      loadData: mockLoadData,
      isLoading: false,
      data: [
        {
          id: 10,
          name: "Admin Role",
          permissions: [{ id: 101, name: "ALL_PRIVILEGES" }],
        },
      ],
      filter: {},
      isLoaded: true,
    });

    server.use(
      http.get(apiTarget("/v1/users/:userId/roles/details"), () => {
        return HttpResponse.json({
          data: [
            {
              id: 10,
              name: "Admin Role",
              permissions: [{ id: 101, name: "ALL_PRIVILEGES" }],
            },
          ],
        });
      }),
    );
  });

  it("should render active user details correctly", () => {
    render(
      <table>
        <tbody>
          <UserRowComponent {...defaultProps} user={mockUserActive} />
        </tbody>
      </table>,
    );

    expect(screen.getByText("john_doe")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("should navigate to details page when search button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <UserRowComponent {...defaultProps} user={mockUserActive} />
        </tbody>
      </table>,
    );

    const searchBtn = screen.getByTitle("See user details");
    await user.click(searchBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/users/1");
  });

  it("should toggle roles accordion details when clicking toggle permissions button", async () => {
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <UserRowComponent {...defaultProps} user={mockUserActive} />
        </tbody>
      </table>,
    );

    const toggleBtn = screen.getByTitle("Show/Hide permissions");
    // Initially not showing accordion
    expect(screen.queryByText("Role: Admin Role")).not.toBeInTheDocument();

    // Toggle to show
    await user.click(toggleBtn);
    expect(screen.getByText("Role: Admin Role")).toBeInTheDocument();
    expect(screen.getByText("ALL_PRIVILEGES")).toBeInTheDocument();

    // Toggle to hide
    await user.click(toggleBtn);
    expect(screen.queryByText("Role: Admin Role")).not.toBeInTheDocument();
  });

  it("should render deleted user details correctly and hide action buttons", () => {
    const mockUserDeleted: User = {
      ...mockUserActive,
      isDeleted: true,
    };
    render(
      <table>
        <tbody>
          <UserRowComponent {...defaultProps} user={mockUserDeleted} />
        </tbody>
      </table>,
    );

    expect(screen.getByText("deleted")).toBeInTheDocument();
    expect(screen.queryByTitle("Generate password reset link")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Disable user")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Enable user")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete user")).not.toBeInTheDocument();
  });

  it("should show Spinner when isLoading is true and details are toggled open", async () => {
    const user = userEvent.setup();
    useQueryMock.mockReturnValue({
      loadData: mockLoadData,
      isLoading: true,
      data: [],
      filter: {},
      isLoaded: false,
    });

    render(
      <table>
        <tbody>
          <UserRowComponent {...defaultProps} user={mockUserActive} />
        </tbody>
      </table>,
    );

    const toggleBtn = screen.getByTitle("Show/Hide permissions");
    await user.click(toggleBtn);

    // Should render a spinner
    const spinner = screen.getAllByTestId("loading-spinner");
    expect(spinner).not.toHaveLength(0);
  });

  it("should render 'No roles found' when user has no roles", async () => {
    const user = userEvent.setup();
    useQueryMock.mockReturnValue({
      loadData: mockLoadData,
      isLoading: false,
      data: [],
      filter: {},
      isLoaded: true,
    });

    render(
      <table>
        <tbody>
          <UserRowComponent {...defaultProps} user={mockUserActive} />
        </tbody>
      </table>,
    );

    const toggleBtn = screen.getByTitle("Show/Hide permissions");
    await user.click(toggleBtn);

    expect(screen.getByText("No roles found")).toBeInTheDocument();
  });

  it("should call loadData using existing filter when toggling details", async () => {
    const user = userEvent.setup();
    const existingFilter = { userId: "some-other-id" };
    useQueryMock.mockReturnValue({
      loadData: mockLoadData,
      isLoading: false,
      data: [],
      filter: existingFilter,
      isLoaded: false,
    });

    render(
      <table>
        <tbody>
          <UserRowComponent {...defaultProps} user={mockUserActive} />
        </tbody>
      </table>,
    );

    const toggleBtn = screen.getByTitle("Show/Hide permissions");
    await user.click(toggleBtn);

    expect(mockLoadData).toHaveBeenCalledWith(
      expect.objectContaining({ userId: mockUserActive.id }),
    );
  });
});
