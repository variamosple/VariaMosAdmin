import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ResponseModel } from "@variamosple/variamos-components";
import { PasswordUpdateForm } from "./index";

// Mock @variamosple/variamos-components
vi.mock("@variamosple/variamos-components", async () => ({
  // The unsaved input and the discard confirmation of the forms
  ...(await (
    await import("@/shared/tests/mocks/variamosComponents")
  ).formInput()),
  ResponseModel: class ResponseModel<T> {
    transactionId?: string;
    errorCode?: number;
    message?: string;
    totalCount?: number;
    data?: T;

    // The three first arguments of the library model, the ones the tests pass
    constructor(transactionId?: string, errorCode?: number, message?: string) {
      this.transactionId = transactionId;
      this.errorCode = errorCode;
      this.message = message;
    }
  },
}));

describe("PasswordUpdateForm Component", () => {
  const mockOnUpdatePasswordSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when showModal is false", () => {
    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={false}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );
    expect(screen.queryByText("Password update")).not.toBeInTheDocument();
  });

  it("renders form elements when showModal is true", () => {
    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Password update")).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update Password" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields on submit", async () => {
    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Update Password" }));

    expect(
      await screen.findByText("Current password is required"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("New password is required"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Please confirm your password"),
    ).toBeInTheDocument();
    expect(mockOnUpdatePasswordSubmit).not.toHaveBeenCalled();
  });

  it("shows passwords do not match error", async () => {
    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/current password/i), "oldPassword");
    await user.type(screen.getByLabelText(/new password/i), "NewPassword123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "WrongConfirm123!",
    );

    await user.click(screen.getByRole("button", { name: "Update Password" }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(mockOnUpdatePasswordSubmit).not.toHaveBeenCalled();
  });

  it("calls onUpdatePasswordSubmit and resets form on success", async () => {
    const successResponse = new ResponseModel(undefined);
    mockOnUpdatePasswordSubmit.mockResolvedValueOnce(successResponse);

    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/current password/i), "oldPassword");
    await user.type(screen.getByLabelText(/new password/i), "NewPassword123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "NewPassword123!",
    );

    await user.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(mockOnUpdatePasswordSubmit).toHaveBeenCalledWith({
        currentPassword: "oldPassword",
        newPassword: "NewPassword123!",
        passwordConfirmation: "NewPassword123!",
      });
    });

    // Check that form values were reset
    expect(
      (screen.getByLabelText(/current password/i) as HTMLInputElement).value,
    ).toBe("");
  });

  it("shows a refused update in the modal and keeps the input", async () => {
    mockOnUpdatePasswordSubmit.mockResolvedValueOnce(
      new ResponseModel(undefined, 400, "Current password is incorrect"),
    );

    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/current password/i), "oldPassword");
    await user.type(screen.getByLabelText(/new password/i), "NewPassword123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "NewPassword123!",
    );
    await user.click(screen.getByRole("button", { name: "Update Password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Current password is incorrect",
    );
    expect(
      (screen.getByLabelText(/current password/i) as HTMLInputElement).value,
    ).toBe("oldPassword");

    // The typed passwords are dropped only once confirmed (UX-08)
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onClose and resets form when Cancel button is clicked", async () => {
    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/current password/i), "oldPassword");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(mockOnClose).toHaveBeenCalledOnce();
    expect(
      (screen.getByLabelText(/current password/i) as HTMLInputElement).value,
    ).toBe("");
  });

  it("disables buttons and shows spinner when isLoading is true", () => {
    render(
      <PasswordUpdateForm
        onUpdatePasswordSubmit={mockOnUpdatePasswordSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={true}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});
