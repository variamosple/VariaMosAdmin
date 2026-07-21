import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ModelFormModal } from "./index";

// Mock @variamosple/variamos-components completely
jest.mock("@variamosple/variamos-components", () => {
  return {
    ResponseModel: class ResponseModel {
      errorCode?: number | null;
      message?: string;
      constructor(code?: number | null, msg?: string) {
        this.errorCode = code;
        this.message = msg;
      }
    },
  };
});

describe("ModelFormModal Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when showModal is false", () => {
    render(
      <ModelFormModal
        modalTitle="Test Title"
        showModal={false}
        onClose={mockOnClose}
        onModelSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal structure with correct title and defaults", () => {
    render(
      <ModelFormModal
        modalTitle="Create a New Model"
        showModal={true}
        onClose={mockOnClose}
        onModelSubmit={mockOnSubmit}
        isLoading={false}
        defaultValue={{
          id: "model-123",
          projectId: "project-123",
          name: "Original Name",
          author: "Author Name",
          description: "Original Description",
          source: "Original Source",
        }}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create a New Model")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Model name")).toHaveValue("Original Name");
    expect(screen.getByPlaceholderText("Model author")).toHaveValue("Author Name");
    expect(screen.getByPlaceholderText("Model description")).toHaveValue("Original Description");
    expect(screen.getByPlaceholderText("Model source")).toHaveValue("Original Source");
  });

  it("triggers validation when submit name is empty", async () => {
    render(
      <ModelFormModal
        modalTitle="Validate Model"
        showModal={true}
        onClose={mockOnClose}
        onModelSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    fireEvent.submit(screen.getByRole("button", { name: /edit model/i }));

    expect(await screen.findByText("Model name is required")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onModelSubmit with updated input values on valid submit", async () => {
    mockOnSubmit.mockResolvedValue({ errorCode: null });

    render(
      <ModelFormModal
        modalTitle="Submit Model"
        showModal={true}
        onClose={mockOnClose}
        onModelSubmit={mockOnSubmit}
        isLoading={false}
        defaultValue={{
          id: "model-123",
          projectId: "project-123",
          name: "VariaMos Model",
          author: "VariaMos Team",
        }}
      />,
    );

    const nameInput = screen.getByPlaceholderText("Model name");
    const user = userEvent.setup();
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");

    fireEvent.submit(screen.getByRole("button", { name: /edit model/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Name",
          author: "VariaMos Team",
        }),
      );
    });
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ModelFormModal
        modalTitle="Test Cancel"
        showModal={true}
        onClose={mockOnClose}
        onModelSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("disables buttons and renders spinner when isLoading is true", () => {
    render(
      <ModelFormModal
        modalTitle="Loading State"
        showModal={true}
        onClose={mockOnClose}
        onModelSubmit={mockOnSubmit}
        isLoading={true}
      />,
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(screen.queryByText("Edit Model")).not.toBeInTheDocument();
  });
});
