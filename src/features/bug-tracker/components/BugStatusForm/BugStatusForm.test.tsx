import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BugStatusForm } from "./index";

describe("BugStatusForm", () => {
  it("offers the next statuses with their effect on GitHub", async () => {
    const user = userEvent.setup();
    render(<BugStatusForm status="open" onChangeStatus={vi.fn()} />);

    const select = screen.getByLabelText("New status");
    expect(
      Array.from((select as HTMLSelectElement).options).map((o) => o.text),
    ).toEqual(["In Progress", "Resolved", "Closed"]);
    expect(
      screen.getByText('The GitHub issue will be labelled "in progress".'),
    ).toBeInTheDocument();

    await user.selectOptions(select, "resolved");
    expect(
      screen.getByText("The GitHub issue will be closed."),
    ).toBeInTheDocument();
  });

  it("sends the chosen status and comment", async () => {
    const user = userEvent.setup();
    const onChangeStatus = vi.fn().mockResolvedValue(null);
    render(<BugStatusForm status="open" onChangeStatus={onChangeStatus} />);

    await user.selectOptions(screen.getByLabelText("New status"), "resolved");
    await user.type(screen.getByLabelText("Comment (optional)"), "Fixed");
    await user.click(screen.getByRole("button", { name: "Update status" }));

    expect(onChangeStatus).toHaveBeenCalledWith("resolved", "Fixed");
    await waitFor(() => {
      expect(screen.getByLabelText("Comment (optional)")).toHaveValue("");
    });
  });

  it("shows the refusal and keeps the comment", async () => {
    const user = userEvent.setup();
    const onChangeStatus = vi
      .fn()
      .mockResolvedValue("The GitHub issue could not be updated.");
    render(<BugStatusForm status="closed" onChangeStatus={onChangeStatus} />);

    await user.type(screen.getByLabelText("Comment (optional)"), "Again");
    await user.click(screen.getByRole("button", { name: "Update status" }));

    expect(
      await screen.findByText("The GitHub issue could not be updated."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Comment (optional)")).toHaveValue("Again");
  });

  it("renders nothing for a status without a manual change", () => {
    const { container } = render(
      <BugStatusForm status="pending" onChangeStatus={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
