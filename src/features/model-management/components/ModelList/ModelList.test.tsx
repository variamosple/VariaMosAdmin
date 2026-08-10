import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Model } from "../../domain/Entity/Model";
import { ModelList } from "./index";

const mockModels: Model[] = [
  {
    id: "1",
    projectId: "p1",
    name: "Model One",
    description: "Description One",
  },
  {
    id: "2",
    projectId: "p2",
    name: "Model Two",
    description: "Description Two",
  },
];

// Mock the variamos-components library which has Paginator
vi.mock("@variamosple/variamos-components", async () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
  };
});

describe("ModelList Component", () => {
  const mockOnModelEdit = vi.fn();
  const mockOnModelDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a list of models correctly", () => {
    render(
      <ModelList
        items={mockModels}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onModelEdit={mockOnModelEdit}
        onModelDelete={mockOnModelDelete}
      />,
    );

    expect(screen.getByText("Model One")).toBeInTheDocument();
    expect(screen.getByText("Model Two")).toBeInTheDocument();
  });

  it("triggers onModelEdit when the edit button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ModelList
        items={mockModels}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onModelEdit={mockOnModelEdit}
        onModelDelete={mockOnModelDelete}
      />,
    );

    const editButtons = screen.getAllByTitle("Edit model");
    await user.click(editButtons[0]);

    expect(mockOnModelEdit).toHaveBeenCalledTimes(1);
    expect(mockOnModelEdit).toHaveBeenCalledWith(mockModels[0]);
  });
});
