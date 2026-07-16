import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

    expect(screen.getByText("Test confirmation message")).toBeDefined();
    expect(screen.getByText("Accept")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("should call onConfirm when Accept is clicked", () => {
    render(
      <ConfirmationModal
        show={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        message="Test confirmation message"
      />,
    );

    fireEvent.click(screen.getByText("Accept"));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when Cancel is clicked", () => {
    render(
      <ConfirmationModal
        show={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        message="Test confirmation message"
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
