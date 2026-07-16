import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserList } from "./index";
import { User } from "../../domain/Entity/User";

const mockNavigate = jest.fn();
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
    useQuery: () => ({
      loadData: jest.fn(),
      isLoading: false,
      data: [],
      filter: {},
      isLoaded: true,
    }),
    PagedModel: class PagedModel {
      pageNumber?: number;
      pageSize?: number;
      constructor(pageNumber?: number, pageSize?: number) {
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
      }
    },
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };
});

const mockUsers: User[] = [
  {
    id: "1",
    user: "john_doe",
    name: "John Doe",
    email: "john@example.com",
    isEnabled: true,
    isDeleted: false,
    createdAt: new Date("2026-07-16T12:00:00Z"),
  },
  {
    id: "2",
    user: "jane_doe",
    name: "Jane Doe",
    email: "jane@example.com",
    isEnabled: false,
    isDeleted: false,
    createdAt: new Date("2026-07-16T12:00:00Z"),
  },
];

describe("UserList Component", () => {
  const mockOnUserResetLink = jest.fn();
  const mockOnUserDisable = jest.fn();
  const mockOnUserEnable = jest.fn();
  const mockOnUserDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a list of users correctly", () => {
    render(
      <UserList
        items={mockUsers}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onUserResetLink={mockOnUserResetLink}
        onUserDisable={mockOnUserDisable}
        onUserEnable={mockOnUserEnable}
        onUserDelete={mockOnUserDelete}
      />,
    );

    expect(screen.getByText("john_doe")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
    expect(screen.getByText("jane_doe")).toBeDefined();
    expect(screen.getByText("jane@example.com")).toBeDefined();
    expect(screen.getByText("active")).toBeDefined();
    expect(screen.getByText("disabled")).toBeDefined();
  });

  it("navigates to user details when search details button is clicked", () => {
    render(
      <UserList
        items={mockUsers}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onUserResetLink={mockOnUserResetLink}
        onUserDisable={mockOnUserDisable}
        onUserEnable={mockOnUserEnable}
        onUserDelete={mockOnUserDelete}
      />,
    );

    const detailButtons = screen.getAllByTitle("See user details");
    fireEvent.click(detailButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/users/1");
  });

  it("triggers onUserDisable when click disable on active user", () => {
    render(
      <UserList
        items={mockUsers}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onUserResetLink={mockOnUserResetLink}
        onUserDisable={mockOnUserDisable}
        onUserEnable={mockOnUserEnable}
        onUserDelete={mockOnUserDelete}
      />,
    );

    const disableButton = screen.getByTitle("Disable user");
    fireEvent.click(disableButton);

    expect(mockOnUserDisable).toHaveBeenCalledWith(mockUsers[0]);
  });

  it("triggers onUserEnable when click enable on disabled user", () => {
    render(
      <UserList
        items={mockUsers}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onUserResetLink={mockOnUserResetLink}
        onUserDisable={mockOnUserDisable}
        onUserEnable={mockOnUserEnable}
        onUserDelete={mockOnUserDelete}
      />,
    );

    const enableButton = screen.getByTitle("Enable user");
    fireEvent.click(enableButton);

    expect(mockOnUserEnable).toHaveBeenCalledWith(mockUsers[1]);
  });

  it("triggers onUserDelete when click delete user", () => {
    render(
      <UserList
        items={mockUsers}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onUserResetLink={mockOnUserResetLink}
        onUserDisable={mockOnUserDisable}
        onUserEnable={mockOnUserEnable}
        onUserDelete={mockOnUserDelete}
      />,
    );

    const deleteButtons = screen.getAllByTitle("Delete user");
    fireEvent.click(deleteButtons[0]);

    expect(mockOnUserDelete).toHaveBeenCalledWith(mockUsers[0]);
  });
});
