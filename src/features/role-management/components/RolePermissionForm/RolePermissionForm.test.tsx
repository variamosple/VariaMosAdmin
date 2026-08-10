import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import {
  useDebouncedValue,
  usePaginatedQuery,
} from "@variamosple/variamos-components";
import { RolePermissionForm } from "./index";

// Mock dependencies
vi.mock("@/shared/hooks/useIntersectionObserver", async () => {
  return {
    default: () => ({
      lastEntryRef: vi.fn(),
      setHasMore: vi.fn(),
      page: 1,
    }),
  };
});

vi.mock("@variamosple/variamos-components", async () => {
  return {
    useDebouncedValue: vi.fn((val) => [val]),
    usePaginatedQuery: vi.fn(),
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
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
  };
});

vi.mock("@/shared/components/InfiniteSelect", async () => {
  return {
    InfiniteSelect: function DummyInfiniteSelect({
      options,
      handleSelect,
      placeholder,
    }: any) {
      return (
        <div data-testid="infinite-select">
          <span>{placeholder}</span>
          <select
            data-testid="select-element"
            onChange={(e) => {
              const selectedOption = options.find(
                (opt: any) => opt.value === Number(e.target.value),
              );
              if (selectedOption) handleSelect(selectedOption);
            }}
          >
            <option value="">Select...</option>
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    },
  };
});

describe("RolePermissionForm", () => {
  const usePaginatedQueryMock = usePaginatedQuery as import("vitest").Mock;
  const useDebouncedValueMock = useDebouncedValue as import("vitest").Mock;

  const mockLoadData = vi.fn();
  const mockSetCurrentPage = vi.fn();
  const mockOnRolePermissionSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useDebouncedValueMock.mockImplementation((val) => [val]);

    mockLoadData.mockResolvedValue({
      data: [
        { id: 101, name: "Read Permission" },
        { id: 102, name: "Write Permission" },
      ],
    });

    usePaginatedQueryMock.mockReturnValue({
      loadData: mockLoadData,
      isLoading: false,
      currentPage: 1,
      setCurrentPage: mockSetCurrentPage,
      totalItems: 2,
    });
  });

  it("should render selection input and submit button", async () => {
    render(
      <RolePermissionForm
        onRolePermissionSubmit={mockOnRolePermissionSubmit}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Read Permission")).toBeInTheDocument();
    });

    expect(screen.getByTestId("infinite-select")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add permission" }),
    ).toBeInTheDocument();
  });

  it("should show validation error if submitted without selection", async () => {
    const user = userEvent.setup();
    render(
      <RolePermissionForm
        onRolePermissionSubmit={mockOnRolePermissionSubmit}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Read Permission")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: "Add permission" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Permission is required")).toBeInTheDocument();
    });
    expect(mockOnRolePermissionSubmit).not.toHaveBeenCalled();
  });

  it("should call onRolePermissionSubmit when valid selection is submitted", async () => {
    render(
      <RolePermissionForm
        onRolePermissionSubmit={mockOnRolePermissionSubmit}
        isLoading={false}
      />,
    );

    const select = screen.getByTestId("select-element");
    await waitFor(() => {
      expect(screen.getByText("Read Permission")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.selectOptions(select, "101");

    const submitBtn = screen.getByRole("button", { name: "Add permission" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnRolePermissionSubmit).toHaveBeenCalledWith({
        permissionId: 101,
      });
    });
  });

  it("should render spinner and disable button if isLoading is true", async () => {
    render(
      <RolePermissionForm
        onRolePermissionSubmit={mockOnRolePermissionSubmit}
        isLoading={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Read Permission")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button");
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});
