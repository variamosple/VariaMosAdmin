import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BugAssigneesForm } from "./index";

const ANA = { id: "admin-1", name: "Ana" };
const BEN = { id: "admin-2", name: "Ben" };

describe("BugAssigneesForm", () => {
  it("checks the current assignees and saves the new selection", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    render(
      <BugAssigneesForm
        assignees={[ANA]}
        candidates={[ANA, BEN]}
        onSave={onSave}
      />,
    );

    expect(screen.getByLabelText("Ana")).toBeChecked();
    expect(screen.getByLabelText("Ben")).not.toBeChecked();
    const save = screen.getByRole("button", { name: "Save assignees" });
    expect(save).toBeDisabled();

    await user.click(screen.getByLabelText("Ana"));
    await user.click(screen.getByLabelText("Ben"));
    await user.click(save);

    expect(onSave).toHaveBeenCalledWith([BEN.id]);
  });

  it("shows the refusal and keeps the selection", async () => {
    const user = userEvent.setup();
    const onSave = vi
      .fn()
      .mockResolvedValue("Only enabled administrators can be assigned.");
    render(
      <BugAssigneesForm assignees={[]} candidates={[ANA]} onSave={onSave} />,
    );

    await user.click(screen.getByLabelText("Ana"));
    await user.click(screen.getByRole("button", { name: "Save assignees" }));

    expect(
      await screen.findByText("Only enabled administrators can be assigned."),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Ana")).toBeChecked();
    });
  });

  it("renders nothing without anyone to assign", () => {
    const { container } = render(
      <BugAssigneesForm assignees={[]} candidates={[]} onSave={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
