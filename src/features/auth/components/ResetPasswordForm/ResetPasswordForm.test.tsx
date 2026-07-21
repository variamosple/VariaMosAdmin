import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ResetPasswordForm } from "./index";

describe("ResetPasswordForm Component", () => {
  const mockOnSubmitPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form elements correctly", () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields on submit", async () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("New password is required")).toBeInTheDocument();
    expect(await screen.findByText("Confirm password is required")).toBeInTheDocument();
    expect(mockOnSubmitPassword).not.toHaveBeenCalled();
  });

  it("shows mismatch error when passwords do not match", async () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), "NewPassword123!");
    await user.type(screen.getByLabelText(/confirm password/i), "DifferentPassword123!");

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(mockOnSubmitPassword).not.toHaveBeenCalled();
  });

  it("calls onSubmitPassword when valid matching passwords are submitted", async () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), "NewPassword123!");
    await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123!");

    // Click submit button (the errors should be resolved, making the button enabled)
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mockOnSubmitPassword).toHaveBeenCalledWith("NewPassword123!");
    });
  });

  it("disables button and shows updating status when isLoading is true", () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} isLoading={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });
});
