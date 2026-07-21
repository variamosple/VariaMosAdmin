import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ForgotPasswordForm } from "./index";

describe("ForgotPasswordForm Component", () => {
  const mockOnSubmitEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form elements correctly", () => {
    render(<ForgotPasswordForm onSubmitEmail={mockOnSubmitEmail} />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows validation error on submit when email is empty", async () => {
    render(<ForgotPasswordForm onSubmitEmail={mockOnSubmitEmail} />);

    // Trigger validation
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(mockOnSubmitEmail).not.toHaveBeenCalled();
  });

  it("calls onSubmitEmail when valid email is submitted", async () => {
    render(<ForgotPasswordForm onSubmitEmail={mockOnSubmitEmail} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockOnSubmitEmail).toHaveBeenCalledWith("user@example.com");
    });
  });

  it("disables submit button and shows sending status when isLoading is true", () => {
    render(<ForgotPasswordForm onSubmitEmail={mockOnSubmitEmail} isLoading={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Sending...")).toBeInTheDocument();
  });
});
