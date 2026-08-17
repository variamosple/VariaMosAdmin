import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserRoleForm } from "./index";

vi.mock("@/shared/hooks/useIntersectionObserver", async () => {
  return {
    default: () => ({
      lastEntryRef: vi.fn(),
      setHasMore: vi.fn(),
      page: 1,
    }),
  };
});

interface SelectOptionProps<T> {
  label: string;
  value: T;
}

interface InfiniteSelectProps<T> {
  options: SelectOptionProps<T>[];
  handleSelect: (option: SelectOptionProps<T>) => void;
}

vi.mock("@/shared/components/InfiniteSelect", async () => {
  return {
    InfiniteSelect: <T,>({ handleSelect, options }: InfiniteSelectProps<T>) => (
      <select
        data-testid="infinite-select"
        onChange={(e) => {
          const opt = options.find((o) => String(o.value) === e.target.value);
          if (opt) handleSelect(opt);
        }}
      >
        <option value="">Select a role</option>
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

const mockLoadData = vi.fn();
vi.mock("@variamosple/variamos-components", async () => {
  return {
    useDebouncedValue: <T,>(val: T) => [val],
    usePaginatedQuery: () => ({
      loadData: mockLoadData,
      isLoading: false,
      currentPage: 1,
      setCurrentPage: vi.fn(),
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
    ResponseModel: class ResponseModel<T = undefined> {
      errorCode?: number;
      message?: string;
      data?: T;
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
  const mockOnUserRoleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadData.mockResolvedValue({
      data: [
        { id: 1, name: "Admin" },
        { id: 2, name: "User" },
      ],
    });
  });

  it("loads and renders the form with role options", async () => {
    render(
      <UserRoleForm
        onUserRoleSubmit={mockOnUserRoleSubmit}
        isLoading={false}
      />,
    );

    const select = await screen.findByTestId("infinite-select");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Add role")).toBeInTheDocument();
  });

  it("submits the selected role when form is submitted", async () => {
    render(
      <UserRoleForm
        onUserRoleSubmit={mockOnUserRoleSubmit}
        isLoading={false}
      />,
    );

    const select = await screen.findByTestId("infinite-select");
    const user = userEvent.setup();
    await user.selectOptions(select, "1");

    const submitButton = screen.getByRole("button", { name: "Add role" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnUserRoleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 1 }),
      );
    });
  });
});
