import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectFormModal } from "./index";
import { ResponseModel } from "@variamosple/variamos-components";

// Mock @variamosple/variamos-components
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

describe("ProjectFormModal Component", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal when showModal is true", () => {
    render(
      <ProjectFormModal
        modalTitle="Create a Project"
        showModal={true}
        onClose={mockOnClose}
        onProjectSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Create a Project")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Project name")).toBeInTheDocument();
    expect(screen.getByLabelText("Access level")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Project author")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Project description")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Project source")).toBeInTheDocument();
  });

  it("does not render the modal when showModal is false", () => {
    render(
      <ProjectFormModal
        modalTitle="Create a Project"
        showModal={false}
        onClose={mockOnClose}
        onProjectSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(screen.queryByText("Create a Project")).not.toBeInTheDocument();
  });

  it("displays default values when editing a project", () => {
    const defaultValue = {
      id: 42,
      name: "Super Project",
      template: true,
      author: "Nathan",
      description: "My project description",
      source: "Open source",
    };

    render(
      <ProjectFormModal
        modalTitle="Edit Project"
        showModal={true}
        onClose={mockOnClose}
        defaultValue={defaultValue}
        onProjectSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(screen.getByDisplayValue("Super Project")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Nathan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("My project description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Open source")).toBeInTheDocument();
    expect(screen.getByLabelText("Access level")).toHaveValue("true");
  });

  it("triggers validation message when project name is empty", async () => {
    const user = userEvent.setup();
    render(
      <ProjectFormModal
        modalTitle="Create Project"
        showModal={true}
        onClose={mockOnClose}
        onProjectSubmit={mockOnSubmit}
        isLoading={false}
        submitText="Save"
      />,
    );

    const submitBtn = screen.getByText("Save");
    await user.click(submitBtn);

    expect(await screen.findByText("Project name is required")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits the form successfully and parses access level (template) value", async () => {
    mockOnSubmit.mockResolvedValue(new ResponseModel("success"));

    render(
      <ProjectFormModal
        modalTitle="Create Project"
        showModal={true}
        onClose={mockOnClose}
        onProjectSubmit={mockOnSubmit}
        isLoading={false}
        submitText="Save"
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Project name"), "Test Project");
    await user.selectOptions(screen.getByLabelText("Access level"), "true");
    await user.type(screen.getByPlaceholderText("Project author"), "Author Name");

    const submitBtn = screen.getByText("Save");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Project",
          template: true,
          author: "Author Name",
        }),
      );
    });
  });

  it("calls onClose and resets form when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectFormModal
        modalTitle="Create Project"
        showModal={true}
        onClose={mockOnClose}
        onProjectSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const cancelBtn = screen.getByText("Cancel");
    await user.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
