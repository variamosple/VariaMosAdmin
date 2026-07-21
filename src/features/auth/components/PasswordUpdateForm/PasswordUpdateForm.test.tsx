import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { PasswordUpdateForm } from "./index";
import { ResponseModel } from "@variamosple/variamos-components";

// Mock @variamosple/variamos-components
jest.mock("@variamosple/variamos-components", () => ({
  ResponseModel: class ResponseModel {
    errorCode: any;
    constructor(errorCode: any) {
      this.errorCode = errorCode;
    }
  },
  PagedModel: class PagedModel {},
}));

describe("PasswordUpdateForm Component", () => {
  const mockOnUpdatePasswordSubmit = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(screen.getByRole("button", { name: "Update Password" })).toBeInTheDocument();
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

    expect(await screen.findByText("Current password is required")).toBeInTheDocument();
    expect(await screen.findByText("New password is required")).toBeInTheDocument();
    expect(await screen.findByText("Please confirm your password")).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/confirm password/i), "WrongConfirm123!");

    await user.click(screen.getByRole("button", { name: "Update Password" }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123!");

    await user.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(mockOnUpdatePasswordSubmit).toHaveBeenCalledWith({
        currentPassword: "oldPassword",
        newPassword: "NewPassword123!",
        passwordConfirmation: "NewPassword123!",
      });
    });

    // Check that form values were reset
    expect((screen.getByLabelText(/current password/i) as HTMLInputElement).value).toBe("");
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

    expect(mockOnClose).toHaveBeenCalled();
    expect((screen.getByLabelText(/current password/i) as HTMLInputElement).value).toBe("");
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
