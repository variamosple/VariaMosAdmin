import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SignUpForm } from "./index";
import { useSession } from "@variamosple/variamos-components";

// Mock @variamosple/variamos-components
jest.mock("@variamosple/variamos-components", () => ({
  useSession: jest.fn(),
  PagedModel: class PagedModel {},
}));

describe("SignUpForm Component", () => {
  const mockOnSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      isLoading: false,
    });
  });

  it("renders form fields correctly", () => {
    render(<SignUpForm onSignUp={mockOnSignUp} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("displays validation errors for empty fields on submit", async () => {
    render(<SignUpForm onSignUp={mockOnSignUp} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText("Full name is required")).toBeInTheDocument();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("password is required")).toBeInTheDocument();
    expect(await screen.findByText("Please confirm your password")).toBeInTheDocument();
    expect(mockOnSignUp).not.toHaveBeenCalled();
  });

  it("displays validation error when passwords do not match", async () => {
    render(<SignUpForm onSignUp={mockOnSignUp} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.type(screen.getByLabelText(/confirm password/i), "Password321!");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(mockOnSignUp).not.toHaveBeenCalled();
  });

  it("calls onSignUp with data when form is successfully filled and submitted", async () => {
    render(<SignUpForm onSignUp={mockOnSignUp} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123!");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockOnSignUp).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Password123!",
        passwordConfirmation: "Password123!",
      });
    });
  });

  it("disables submit button and shows loading spinner when session is loading", () => {
    (useSession as jest.Mock).mockReturnValue({
      isLoading: true,
    });
    render(<SignUpForm onSignUp={mockOnSignUp} />);

    const submitBtn = screen.getByRole("button");
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});
