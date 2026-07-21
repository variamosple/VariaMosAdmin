import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectRowComponent } from "./ProjectRow";
import { Project } from "../../domain/Entity/Project";

// Jest mock of variamos-components (just in case)
jest.mock("@variamosple/variamos-components", () => ({}));

describe("ProjectRowComponent", () => {
  const mockOnProjectEdit = jest.fn();
  const mockOnProjectDelete = jest.fn();

  const sampleProject: Project = {
    id: 42,
    name: "Quantum Project",
    description: "A project exploring quantum mechanics",
    author: "Dr. Schrodinger",
    source: "Local Lab",
    date: new Date("2026-01-01T12:00:00.000Z"),
    template: true,
    project: {
      id: "proj-1",
      name: "Quantum Product Line Project",
      enable: true,
      productLines: [
        {
          id: "pl-1",
          name: "Superconductors",
          type: "Hardware",
          domain: "Physics",
          domainEngineering: {
            models: [{ id: "m-1", name: "SQUID Model", type: "Core" }],
          },
          applicationEngineering: {
            models: [{ id: "m-2", name: "MRI App Model", type: "App" }],
          },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (project: Project = sampleProject) => {
    return render(
      <table>
        <tbody>
          <ProjectRowComponent
            project={project}
            onProjectEdit={mockOnProjectEdit}
            onProjectDelete={mockOnProjectDelete}
          />
        </tbody>
      </table>,
    );
  };

  it("renders the project attributes correctly in the table row", () => {
    renderComponent();

    expect(screen.getByText("Quantum Project")).toBeInTheDocument();
    expect(screen.getByText("A project exploring quantum mechanics")).toBeInTheDocument();
    expect(screen.getByText("Dr. Schrodinger")).toBeInTheDocument();
    expect(screen.getByText("Local Lab")).toBeInTheDocument();
    // Verify template formatted as Public (template=true)
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("toggles the project details view on clicking show/hide button", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Details should not be present initially
    expect(
      screen.queryByText("Product Line: Superconductors - Type: Hardware - Domain: Physics"),
    ).toBeNull();

    const toggleBtn = screen.getByTitle("Show/Hide project details");

    // Open Details
    await user.click(toggleBtn);
    expect(
      screen.getByText("Product Line: Superconductors - Type: Hardware - Domain: Physics"),
    ).toBeInTheDocument();
    expect(screen.getByText("SQUID Model")).toBeInTheDocument();
    expect(screen.getByText("MRI App Model")).toBeInTheDocument();

    // Close Details
    await user.click(toggleBtn);
    expect(
      screen.queryByText("Product Line: Superconductors - Type: Hardware - Domain: Physics"),
    ).toBeNull();
  });

  it("renders 'No data' if productLines are missing", async () => {
    const user = userEvent.setup();
    const projectNoPL: Project = {
      ...sampleProject,
      project: {
        id: "proj-1",
        name: "Empty Project",
        enable: true,
        productLines: [],
      },
    };

    renderComponent(projectNoPL);

    const toggleBtn = screen.getByTitle("Show/Hide project details");
    await user.click(toggleBtn);

    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
