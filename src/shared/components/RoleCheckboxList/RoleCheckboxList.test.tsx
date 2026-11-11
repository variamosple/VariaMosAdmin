import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleCheckboxList } from "./index";

const roles = [
  { id: 1, name: "Administrator" },
  { id: 2, name: "Language developer" },
];

describe("RoleCheckboxList", () => {
  it("checks the selected roles and toggles a role by its name", async () => {
    const onToggle = vi.fn();
    render(
      <RoleCheckboxList
        roles={roles}
        total={2}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        selected={["Administrator"]}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByLabelText("Administrator")).toBeChecked();
    expect(screen.getByLabelText("Language developer")).not.toBeChecked();
    await userEvent.setup().click(screen.getByLabelText("Language developer"));
    expect(onToggle).toHaveBeenCalledWith("Language developer");
  });

  it("says when only the first roles are listed, and offers to retry a failure", async () => {
    const onRetry = vi.fn();
    render(
      <RoleCheckboxList
        roles={roles}
        total={150}
        loading={false}
        error="The roles could not be loaded."
        onRetry={onRetry}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Only the first 2 of 150 roles are listed."),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
