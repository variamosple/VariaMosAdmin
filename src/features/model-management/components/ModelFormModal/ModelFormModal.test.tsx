import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ModelFormModal } from "./index";

// Mock @variamosple/variamos-components completely
vi.mock("@variamosple/variamos-components", async () => {
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
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(screen.getByPlaceholderText("Model name")).toHaveValue(
      "Original Name",
    );
    expect(screen.getByPlaceholderText("Model author")).toHaveValue(
      "Author Name",
    );
    expect(screen.getByPlaceholderText("Model description")).toHaveValue(
      "Original Description",
    );
    expect(screen.getByPlaceholderText("Model source")).toHaveValue(
      "Original Source",
    );
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

    expect(
      await screen.findByText("Model name is required"),
    ).toBeInTheDocument();
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
          languageId: 1,
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

  describe("project and language search on the server (EV-96)", () => {
    const renderCreateForm = (
      props: Partial<Parameters<typeof ModelFormModal>[0]> = {},
    ) =>
      render(
        <ModelFormModal
          modalTitle="New model"
          showModal={true}
          onClose={mockOnClose}
          onModelSubmit={mockOnSubmit}
          isLoading={false}
          projects={[{ id: "p-1", name: "Alpha" }]}
          languages={[{ id: 1, name: "Feature model" }]}
          {...props}
        />,
      );

    it("asks the server for the projects whose name is typed", async () => {
      const onProjectSearch = vi.fn();
      const user = userEvent.setup();
      renderCreateForm({ onProjectSearch });

      await user.click(screen.getByText("Select a project..."));
      await user.type(screen.getByPlaceholderText("Type to search..."), "Zeta");

      await waitFor(() => expect(onProjectSearch).toHaveBeenCalledWith("Zeta"));
      expect(onProjectSearch).toHaveBeenCalledTimes(1);
    });

    it("asks nothing when the form opens", async () => {
      const onProjectSearch = vi.fn();
      const onLanguageSearch = vi.fn();
      renderCreateForm({ onProjectSearch, onLanguageSearch });

      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(onProjectSearch).not.toHaveBeenCalled();
      expect(onLanguageSearch).not.toHaveBeenCalled();
    });

    it("keeps the name of the picked project when a later search leaves it out", async () => {
      const user = userEvent.setup();
      const { rerender } = renderCreateForm();

      await user.click(screen.getByText("Select a project..."));
      await user.click(screen.getByText("Alpha"));
      rerender(
        <ModelFormModal
          modalTitle="New model"
          showModal={true}
          onClose={mockOnClose}
          onModelSubmit={mockOnSubmit}
          isLoading={false}
          projects={[{ id: "p-2", name: "Beta" }]}
          languages={[]}
        />,
      );

      expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
    });
  });
});
