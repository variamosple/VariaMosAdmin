import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { queryRoles } from "@/features/role-management/api/RoleRepository";
import { UserRoleForm } from "./index";

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

vi.mock("@variamosple/variamos-components", async () =>
  (await import("@/shared/tests/mocks/variamosComponents")).variamosComponents({
    useDebouncedValue: <T,>(value: T) => [value] as never,
  }),
);

vi.mock("@/features/role-management/api/RoleRepository", () => ({
  queryRoles: vi.fn(),
}));

describe("UserRoleForm Component", () => {
  const mockOnUserRoleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queryRoles).mockResolvedValue({
      data: [
        { id: 1, name: "Admin" },
        { id: 2, name: "User" },
      ],
      totalCount: 2,
    } as Awaited<ReturnType<typeof queryRoles>>);
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
    // The roles load after the first render: wait for them before choosing one
    await screen.findByRole("option", { name: "Admin" });
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
