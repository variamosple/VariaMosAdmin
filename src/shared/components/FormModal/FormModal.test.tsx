import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FormModal } from "./index";

/** A form of one field, as the form modals of the pages hold it. */
const NameForm = ({
  onClose,
  isLoading = false,
}: {
  onClose: () => void;
  isLoading?: boolean;
}) => {
  const [name, setName] = useState("");
  return (
    <FormModal
      title="New role"
      show
      isLoading={isLoading}
      submitText="Save"
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
      holdsInput={name.trim() !== ""}
    >
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
    </FormModal>
  );
};

const QUESTION = /Discard your input\?/;

describe("FormModal", () => {
  it("closes at once when nothing was typed", async () => {
    const onClose = vi.fn();
    render(<NameForm onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(QUESTION)).not.toBeInTheDocument();
  });

  it.each([
    ["the close button", () => screen.getByRole("button", { name: "Close" })],
    ["Cancel", () => screen.getByRole("button", { name: "Cancel" })],
  ])("asks before %s drops the input", async (_way, button) => {
    const onClose = vi.fn();
    render(<NameForm onClose={onClose} />);
    await userEvent.type(screen.getByLabelText("Name"), "Reviewer");

    await userEvent.click(button());

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(QUESTION);
    expect(screen.getByRole("button", { name: "Keep editing" })).toHaveFocus();
  });

  it("asks on Escape too, and keeps the input when asked", async () => {
    const onClose = vi.fn();
    render(<NameForm onClose={onClose} />);
    await userEvent.type(screen.getByLabelText("Name"), "Reviewer");

    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Name")).toHaveValue("Reviewer");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("drops the input when the answer is Discard", async () => {
    const onClose = vi.fn();
    render(<NameForm onClose={onClose} />);
    await userEvent.type(screen.getByLabelText("Name"), "Reviewer");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("cannot be closed while saving", async () => {
    const onClose = vi.fn();
    render(<NameForm onClose={onClose} isLoading />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
