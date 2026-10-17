import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { ResetPasswordForm } from "./index";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("ResetPasswordForm Component", () => {
  const mockOnSubmitPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form elements correctly", () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields on submit", async () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText("New password is required"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Confirm password is required"),
    ).toBeInTheDocument();
    expect(mockOnSubmitPassword).not.toHaveBeenCalled();
  });

  it("shows mismatch error when passwords do not match", async () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), "NewPassword123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "DifferentPassword123!",
    );

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(mockOnSubmitPassword).not.toHaveBeenCalled();
  });

  it("calls onSubmitPassword when valid matching passwords are submitted", async () => {
    render(<ResetPasswordForm onSubmitPassword={mockOnSubmitPassword} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), "NewPassword123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "NewPassword123!",
    );

    // Click submit button (the errors should be resolved, making the button enabled)
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mockOnSubmitPassword).toHaveBeenCalledWith("NewPassword123!");
    });
  });

  it("disables button and shows updating status when isLoading is true", () => {
    render(
      <ResetPasswordForm
        onSubmitPassword={mockOnSubmitPassword}
        isLoading={true}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });
});

describe("ResetPasswordForm with the configured password policy", () => {
  it("applies and shows the rule served by the backend", async () => {
    server.use(
      http.get(apiTarget("/auth/password-policy"), () =>
        HttpResponse.json({
          data: {
            minLength: 12,
            maxLength: 64,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecial: true,
          },
        }),
      ),
    );
    const onSubmit = vi.fn();
    render(<ResetPasswordForm onSubmitPassword={onSubmit} />);
    const rule =
      "Password must be between 12 and 64 characters long and contain uppercase, lowercase, number, and special character.";

    expect(await screen.findByText(rule)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), "Short1!aa");
    await user.type(screen.getByLabelText(/confirm password/i), "Short1!aa");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(rule)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
