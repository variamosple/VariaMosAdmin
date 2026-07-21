import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ModelRowComponent } from "./ModelRow";
import { Model } from "@/features/model-management/domain/Entity/Model";

describe("ModelRowComponent", () => {
  const mockOnModelEdit = jest.fn();
  const mockOnModelDelete = jest.fn();

  const sampleModel: Model = {
    id: "model-1",
    projectId: "project-123",
    projectName: "Awesome Project",
    engineeringType: "Domain Engineering",
    name: "Standard Model",
    type: "Core",
    description: "A very descriptive model description",
    author: "Jane Doe",
    source: "External source",
    owners: [
      { id: "owner-1", name: "Alice", email: "alice@example.com" },
      { id: "owner-2", name: "Bob", email: "bob@example.com" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (model: Model = sampleModel) => {
    return render(
      <table>
        <tbody>
          <ModelRowComponent
            model={model}
            onModelEdit={mockOnModelEdit}
            onModelDelete={mockOnModelDelete}
          />
        </tbody>
      </table>,
    );
  };

  it("renders the model attributes correctly in the table row", () => {
    renderComponent();

    expect(screen.getByText("Standard Model")).toBeInTheDocument();
    expect(screen.getByText("A very descriptive model description")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("External source")).toBeInTheDocument();
    expect(screen.getByText("Domain Engineering")).toBeInTheDocument();
    expect(screen.getByText("Awesome Project")).toBeInTheDocument();
  });

  it("toggles the model details view on clicking show/hide button", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Details should not be present initially
    expect(screen.queryByText("Owners")).not.toBeInTheDocument();

    const toggleBtn = screen.getByTitle("Show/Hide model details");

    // Open Details
    await user.click(toggleBtn);
    expect(screen.getByText("Owners")).toBeInTheDocument();
    expect(
      screen.getByText("Alice (alice@example.com), Bob (bob@example.com)"),
    ).toBeInTheDocument();

    // Close Details
    await user.click(toggleBtn);
    expect(screen.queryByText("Owners")).not.toBeInTheDocument();
  });

  it("handles empty or missing owners gracefully when details are shown", async () => {
    const user = userEvent.setup();
    const modelNoOwners: Model = {
      ...sampleModel,
      owners: undefined,
    };

    renderComponent(modelNoOwners);

    const toggleBtn = screen.getByTitle("Show/Hide model details");
    await user.click(toggleBtn);

    // Owners title is rendered, but content description is empty
    expect(screen.getByText("Owners")).toBeInTheDocument();
  });
});
