import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationModal from "./index";

describe("ConfirmationModal Component", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const renderModal = () =>
    render(
      <ConfirmationModal
        show={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Delete role"
        message='Delete the role "Editors"?'
        confirmLabel="Delete role"
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a dialog named by its title, with the action as its button", () => {
    renderModal();

    expect(
      screen.getByRole("dialog", { name: "Delete role" }),
    ).toBeInTheDocument();
    expect(screen.getByText('Delete the role "Editors"?')).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete role" }),
    ).toBeInTheDocument();
  });

  it("confirms with the action button", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Delete role" }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("cancels with Cancel or the close button", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(mockOnCancel).toHaveBeenCalledTimes(2);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
