import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { Bug } from "../../domain/Bug";
import { BugDetailsModal } from "./index";

const PENDING: Bug = {
  id: "bug-1",
  title: "Crash on save",
  description: "Saving a model fails.",
  priority: "medium",
  category: "Model",
  status: "pending",
};

/** The window with its comment draft, as the bug list page holds it. */
const DetailsWithDraft = ({ onHide }: { onHide: () => void }) => {
  const [body, setBody] = useState("");
  return (
    <BugDetailsModal
      bug={PENDING}
      onHide={onHide}
      canUpdate
      assignableUsers={[]}
      notes={[]}
      isLoadingNotes={false}
      draft={{
        body,
        setBody,
        isSubmitting: false,
        error: null,
        submit: async (e) => e.preventDefault(),
      }}
      onSaveAssignees={vi.fn()}
      onChangeStatus={vi.fn()}
    />
  );
};

describe("BugDetailsModal closing (UX-08)", () => {
  it("closes at once without a comment", async () => {
    const onHide = vi.fn();
    render(<DetailsWithDraft onHide={onHide} />);

    await userEvent.keyboard("{Escape}");

    expect(onHide).toHaveBeenCalledOnce();
  });

  it("asks before dropping a written comment, which then goes for good", async () => {
    const onHide = vi.fn();
    render(<DetailsWithDraft onHide={onHide} />);
    const comment = screen.getByPlaceholderText("Write a comment...");
    await userEvent.type(comment, "Seen on Edge too");

    // The button of the footer, not the cross of the header
    const [, footerClose] = screen.getAllByRole("button", { name: "Close" });
    await userEvent.click(footerClose as HTMLElement);
    expect(onHide).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(onHide).toHaveBeenCalledOnce();
    // Not carried over to the next bug shown
    expect(comment).toHaveValue("");
  });
});
