import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageFormModal } from "./index";
import { ResponseModel } from "@variamosple/variamos-components";

jest.mock("@variamosple/variamos-components", () => {
  return {
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };
});

describe("LanguageFormModal Component", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal with fields and defaultValue", () => {
    const defaultValue = { id: 1, name: "DSL-1", stateAccept: "PENDING" };
    render(
      <LanguageFormModal
        modalTitle="Edit Language"
        showModal={true}
        onClose={mockOnClose}
        defaultValue={defaultValue}
        onLanguageSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(screen.getAllByText("Edit Language")).toHaveLength(2);
    expect(screen.getByPlaceholderText("Language name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("DSL-1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pending")).toBeInTheDocument();
  });

  it("submits the form and calls onLanguageSubmit with inputs when valid", async () => {
    mockOnSubmit.mockResolvedValue(new ResponseModel("success"));

    render(
      <LanguageFormModal
        modalTitle="Create Language"
        showModal={true}
        onClose={mockOnClose}
        onLanguageSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const nameInput = screen.getByPlaceholderText("Language name");
    const user = userEvent.setup();
    await user.type(nameInput, "NewDSL");

    const submitButton = screen.getByText("Edit Language");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "NewDSL",
          stateAccept: "ACTIVE", // default select value
        }),
      );
    });
  });

  it("triggers validation message when name is empty", async () => {
    const user = userEvent.setup();
    render(
      <LanguageFormModal
        modalTitle="Create Language"
        showModal={true}
        onClose={mockOnClose}
        onLanguageSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const submitButton = screen.getByText("Edit Language");
    await user.click(submitButton);

    expect(await screen.findByText("Language name is required")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
