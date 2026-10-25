import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryUsers } from "@/features/user-management/api/UserRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import type { UsersFilter } from "@/features/user-management/domain/Entity/UsersFilter";
import { UserRecipientPicker } from "./index";

vi.mock("@/features/user-management/api/UserRepository", () => ({
  queryUsers: vi.fn(),
}));

const user = (id: string, name: string, extra: Partial<User> = {}): User => ({
  id,
  user: id,
  name,
  email: `${id}@example.com`,
  isEnabled: true,
  isDeleted: false,
  createdAt: new Date(),
  ...extra,
});

const answer = (users: User[]) => {
  const response = new ResponseModel<User[]>("queryUsers");
  response.data = users;
  return response;
};

const alice = user("alice", "Alice Smith");
const bob = user("bob", "Bob Jones");

describe("UserRecipientPicker", () => {
  const onAdd = vi.fn();
  const onRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queryUsers).mockResolvedValue(answer([alice, bob]));
  });

  const renderPicker = (selected: User[] = []) =>
    render(
      <>
        <UserRecipientPicker
          selected={selected}
          onAdd={onAdd}
          onRemove={onRemove}
        />
        <button type="button">Elsewhere</button>
      </>,
    );

  it("searches the accounts on the server with the typed text (UX-03)", async () => {
    // The 250th account is not in any first page: only the search finds it
    vi.mocked(queryUsers).mockImplementation(async (filter: UsersFilter) =>
      answer(
        filter.search === "user250" ? [user("user250", "Account 250")] : [],
      ),
    );
    renderPicker();

    await userEvent.type(screen.getByRole("combobox"), "user250");

    expect(
      await screen.findByRole("option", { name: /Account 250/ }),
    ).toBeInTheDocument();
    expect(vi.mocked(queryUsers)).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "user250" }),
    );
  });

  it("does not offer disabled, deleted or already chosen accounts", async () => {
    vi.mocked(queryUsers).mockResolvedValue(
      answer([
        alice,
        bob,
        user("carol", "Carol Off", { isEnabled: false }),
        user("dave", "Dave Gone", { isDeleted: true }),
      ]),
    );
    renderPicker([bob]);

    await userEvent.click(screen.getByRole("combobox"));

    expect(
      await screen.findByRole("option", { name: /Alice Smith/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("1 user found")).toBeInTheDocument();
  });

  it("adds an account with the arrow keys and Enter", async () => {
    renderPicker();
    const field = screen.getByRole("combobox");

    await userEvent.click(field);
    await screen.findByRole("option", { name: /Alice Smith/ });
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");

    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /Bob Jones/ }).id,
    );
    await userEvent.keyboard("{Enter}");

    expect(onAdd).toHaveBeenCalledWith(bob);
    expect(field).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the list on Escape, keeping the focus in the field", async () => {
    renderPicker();
    const field = screen.getByRole("combobox");

    await userEvent.click(field);
    expect(field).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");

    expect(field).toHaveAttribute("aria-expanded", "false");
    expect(field).toHaveFocus();
  });

  it("closes the list on a click outside", async () => {
    renderPicker();
    await userEvent.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("adds an account with the mouse", async () => {
    renderPicker();
    await userEvent.click(screen.getByRole("combobox"));

    await userEvent.click(
      await screen.findByRole("option", { name: /Alice Smith/ }),
    );

    expect(onAdd).toHaveBeenCalledWith(alice);
  });

  it("shows a failed search and searches again on Retry", async () => {
    vi.mocked(queryUsers).mockResolvedValueOnce(
      new ResponseModel<User[]>("queryUsers").withError(
        403,
        "You are not allowed to list the users.",
      ),
    );
    renderPicker();
    await userEvent.click(screen.getByRole("combobox"));

    expect(
      await screen.findByText("You are not allowed to list the users."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("option", { name: /Alice Smith/ }),
    ).toBeInTheDocument();
    expect(vi.mocked(queryUsers)).toHaveBeenCalledTimes(2);
  });

  it("removes a chosen account from its badge", async () => {
    renderPicker([alice]);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove Alice Smith" }),
    );

    expect(onRemove).toHaveBeenCalledWith("alice");
  });

  it("asks for a narrower search when a full page comes back", async () => {
    vi.mocked(queryUsers).mockResolvedValue(
      answer(
        Array.from({ length: 20 }, (_, index) =>
          user(`u${index}`, `User ${index}`),
        ),
      ),
    );
    renderPicker();
    await userEvent.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(20);
    });
    expect(screen.getByText(/First 20 results/)).toBeInTheDocument();
  });
});
