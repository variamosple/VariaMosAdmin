import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectSearchForm } from "./index";

// Mock the variamos-components library which is imported by ProjectsFilter
jest.mock("@variamosple/variamos-components", () => {
  return {
    PagedModel: class PagedModel {
      pageNumber?: number;
      pageSize?: number;
      constructor(pageNumber?: number, pageSize?: number) {
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
      }
    },
  };
});

describe("ProjectSearchForm Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnSearchReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders form fields correctly", () => {
    render(
      <ProjectSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
      />,
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Access level")).toBeInTheDocument();
    expect(screen.getByTitle("Clear results")).toBeInTheDocument();
  });

  it("submits the form when values change after 500ms debounce", async () => {
    render(
      <ProjectSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
      />,
    );

    const nameInput = screen.getByLabelText("Name");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(nameInput, "My Project");

    // Since we are changing values, we must trigger form state isDirty by typing
    // Let's check: the useEffect depends on values, isDirty, handleSubmit, submit.
    // Jest timer should be advanced.
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Project",
      }),
    );
  });

  it("handles dropdown change and triggers onSubmit", async () => {
    render(
      <ProjectSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
      />,
    );

    const select = screen.getByLabelText("Access level");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.selectOptions(select, "true");

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isTemplate: true,
      }),
    );
  });

  it("calls onSearchReset and resets fields when reset button is clicked", async () => {
    render(
      <ProjectSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
      />,
    );

    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(nameInput, "Dirty Value");

    const resetButton = screen.getByTitle("Clear results");
    await user.click(resetButton);

    expect(mockOnSearchReset).toHaveBeenCalledTimes(1);
    expect(nameInput.value).toBe("");
  });
});
