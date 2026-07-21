import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationModal from "./index";

describe("ConfirmationModal Component", () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render message and buttons when show is true", () => {
    render(
      <ConfirmationModal
        show={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        message="Test confirmation message"
      />,
    );

    expect(screen.getByText("Test confirmation message")).toBeInTheDocument();
    expect(screen.getByText("Accept")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should call onConfirm when Accept is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationModal
        show={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        message="Test confirmation message"
      />,
    );

    await user.click(screen.getByText("Accept"));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationModal
        show={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        message="Test confirmation message"
      />,
    );

    await user.click(screen.getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
