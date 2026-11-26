import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Modal } from "react-bootstrap";
import { withDialogBoundary } from ".";

interface NoteDialogProps {
  show: boolean;
  onClose: () => void;
}

const BrokenDialog = ({ show }: NoteDialogProps) => {
  if (show) throw new Error("Cannot read the note");
  return <Modal show={false} />;
};

const NoteDialog = withDialogBoundary(BrokenDialog, (p) => ({
  show: p.show,
  onClose: p.onClose,
}));

const Page = () => {
  const [show, setShow] = useState(false);
  return (
    <>
      <label>
        Page note
        <input />
      </label>
      <button type="button" onClick={() => setShow(true)}>
        Open
      </button>
      <NoteDialog show={show} onClose={() => setShow(false)} />
    </>
  );
};

describe("withDialogBoundary (ADM-N53)", () => {
  it("keeps the page and its input when the dialog fails, and closes", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<Page />);
    await userEvent.type(screen.getByLabelText("Page note"), "Kept");

    await userEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This window stopped",
    );
    expect(screen.getByLabelText("Page note")).toHaveValue("Kept");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Page note")).toHaveValue("Kept");
    consoleError.mockRestore();
  });
});
