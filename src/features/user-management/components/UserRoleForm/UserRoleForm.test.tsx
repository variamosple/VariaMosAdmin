import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserRoleForm } from "./index";

jest.mock("@/shared/hooks/useIntersectionObserver", () => {
  return () => ({
    lastEntryRef: jest.fn(),
    setHasMore: jest.fn(),
    page: 1,
  });
});

jest.mock("@/shared/components/InfiniteSelect", () => {
  return {
    InfiniteSelect: ({ handleSelect, options }: any) => (
      <select
        data-testid="infinite-select"
        onChange={(e) => {
          const opt = options.find((o: any) => String(o.value) === e.target.value);
          if (opt) handleSelect(opt);
        }}
      >
        <option value="">Select a role</option>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

const mockLoadData = jest.fn();
jest.mock("@variamosple/variamos-components", () => {
  return {
    useDebouncedValue: (val: any) => [val],
    usePaginatedQuery: () => ({
      loadData: mockLoadData,
      isLoading: false,
      currentPage: 1,
      setCurrentPage: jest.fn(),
      totalItems: 2,
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
    RolesFilter: class RolesFilter {
      search?: string;
      page?: number;
      constructor(search?: string, page?: number) {
        this.search = search;
        this.page = page;
      }
    },
  };
});

describe("UserRoleForm Component", () => {
  const mockOnUserRoleSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadData.mockResolvedValue({
      data: [
        { id: 1, name: "Admin" },
        { id: 2, name: "User" },
      ],
    });
  });

  it("loads and renders the form with role options", async () => {
    render(<UserRoleForm onUserRoleSubmit={mockOnUserRoleSubmit} isLoading={false} />);

    const select = await screen.findByTestId("infinite-select");
    expect(select).toBeDefined();
    expect(screen.getByText("Add role")).toBeDefined();
  });

  it("submits the selected role when form is submitted", async () => {
    render(<UserRoleForm onUserRoleSubmit={mockOnUserRoleSubmit} isLoading={false} />);

    const select = await screen.findByTestId("infinite-select");
    fireEvent.change(select, { target: { value: "1" } });

    const submitButton = screen.getByRole("button", { name: "Add role" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnUserRoleSubmit).toHaveBeenCalledWith(expect.objectContaining({ roleId: 1 }));
    });
  });
});
