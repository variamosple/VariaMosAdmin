import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectList } from "./index";
import { Project } from "../../domain/Entity/Project";

const mockProjects: Project[] = [
  { id: 1, name: "Project One", template: false, description: "Description One" },
  { id: 2, name: "Project Two", template: true, description: "Description Two" },
];

// Mock the variamos-components library which has Paginator
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
  };
});

describe("ProjectList Component", () => {
  const mockOnProjectEdit = jest.fn();
  const mockOnProjectDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a list of projects correctly", () => {
    render(
      <ProjectList
        items={mockProjects}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onProjectEdit={mockOnProjectEdit}
        onProjectDelete={mockOnProjectDelete}
      />,
    );

    // Check project names are rendered
    expect(screen.getByText("Project One")).toBeInTheDocument();
    expect(screen.getByText("Project Two")).toBeInTheDocument();
  });

  it("triggers onProjectEdit when the edit button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectList
        items={mockProjects}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onProjectEdit={mockOnProjectEdit}
        onProjectDelete={mockOnProjectDelete}
      />,
    );

    // Find and click the edit button
    const editButtons = screen.getAllByTitle("Edit project");
    await user.click(editButtons[0]);

    expect(mockOnProjectEdit).toHaveBeenCalledTimes(1);
    expect(mockOnProjectEdit).toHaveBeenCalledWith(mockProjects[0]);
  });

  it("triggers onProjectDelete when the delete button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectList
        items={mockProjects}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onProjectEdit={mockOnProjectEdit}
        onProjectDelete={mockOnProjectDelete}
      />,
    );

    // Find and click the delete button
    const deleteButtons = screen.getAllByTitle("Delete project");
    await user.click(deleteButtons[1]);

    expect(mockOnProjectDelete).toHaveBeenCalledTimes(1);
    expect(mockOnProjectDelete).toHaveBeenCalledWith(mockProjects[1]);
  });
});
