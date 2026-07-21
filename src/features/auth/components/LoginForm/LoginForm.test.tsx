import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { LoginForm } from "./index";
import { useSession } from "@variamosple/variamos-components";

import { MemoryRouter } from "react-router-dom";

// Mock @variamosple/variamos-components to avoid ESM import errors
jest.mock("@variamosple/variamos-components", () => ({
  useSession: jest.fn(),
  PagedModel: class PagedModel {},
}));

describe("LoginForm Component", () => {
  const mockOnSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      isLoading: false,
    });
  });

  const renderLoginForm = () =>
    render(
      <MemoryRouter>
        <LoginForm onSignIn={mockOnSignIn} />
      </MemoryRouter>,
    );

  it("renders form inputs and submit button", () => {
    renderLoginForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
  });

  it("shows validation errors when fields are empty on submit", async () => {
    renderLoginForm();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  it("submits the form when fields are filled and valid", async () => {
    renderLoginForm();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("disables submit button and shows loading spinner when session is loading", () => {
    (useSession as jest.Mock).mockReturnValue({
      isLoading: true,
    });
    renderLoginForm();

    const submitBtn = screen.getByRole("button");
    expect(submitBtn).toBeDisabled();
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });
});
