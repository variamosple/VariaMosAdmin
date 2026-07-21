import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SignUpPage } from "./SignUpPage";
import { useSession } from "@variamosple/variamos-components";

import { MemoryRouter } from "react-router-dom";

// Mock @variamosple/variamos-components
jest.mock("@variamosple/variamos-components", () => ({
  useSession: jest.fn(),
  PagedModel: class PagedModel {},
}));

// Mock Subcomponents
jest.mock("../components/SignUpForm", () => ({
  SignUpForm: ({ onSignUp }: any) => (
    <button data-testid="mock-signup-form" onClick={() => onSignUp({ email: "test@example.com" })}>
      Submit SignUp
    </button>
  ),
}));

jest.mock("../components/GoogleLogin", () => ({
  GoogleLogin: ({ text }: any) => <div data-testid="mock-google-login">Google Login: {text}</div>,
}));

describe("SignUpPage Page Component", () => {
  const mockSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
    });
  });

  it("renders SignUpPage components correctly", () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );
    expect(screen.getByAltText("Variamos logo")).toBeInTheDocument();
    expect(screen.getByTestId("mock-signup-form")).toBeInTheDocument();
    expect(screen.getByTestId("mock-google-login")).toHaveTextContent("signup_with");
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("handles successful sign up and displays success message", async () => {
    mockSignUp.mockResolvedValueOnce({ errorCode: null, message: "Registration successful" });
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("mock-signup-form"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({ email: "test@example.com" });
    });
    expect(screen.getByText("Registration successful")).toBeInTheDocument();
  });

  it("handles failed sign up and displays error message", async () => {
    mockSignUp.mockResolvedValueOnce({ errorCode: 400, message: "Email already exists" });
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("mock-signup-form"));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });

    // Close error alert
    await user.click(screen.getByLabelText("Close alert"));
    expect(screen.queryByText("Email already exists")).not.toBeInTheDocument();
  });
});
