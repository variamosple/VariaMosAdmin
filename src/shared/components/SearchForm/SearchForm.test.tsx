import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchForm } from "./index";

describe("SearchForm Component", () => {
  const mockOnSubmit = vi.fn();
  const mockOnSearchReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with correct placeholder", () => {
    render(
      <SearchForm
        onSubmit={mockOnSubmit}
        onSearchReset={mockOnSearchReset}
        isLoading={false}
        placeholder="Filter list"
      />,
    );

    expect(screen.getByPlaceholderText("Filter list")).toBeInTheDocument();
  });

  it("triggers onSubmit with a 500ms debounce when user types", async () => {
    render(
      <SearchForm onSubmit={mockOnSubmit} onSearchReset={mockOnSearchReset} isLoading={false} />,
    );

    const input = screen.getByPlaceholderText("Search");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await user.type(input, "react");

    expect(mockOnSubmit).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith("react");
  });

  it("resets filter values and calls onSearchReset when trash button is clicked", async () => {
    render(
      <SearchForm onSubmit={mockOnSubmit} onSearchReset={mockOnSearchReset} isLoading={false} />,
    );

    const input = screen.getByPlaceholderText("Search");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "delete-me");

    const clearButton = screen.getByTitle("Clear results");
    await user.click(clearButton);

    expect(mockOnSearchReset).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe("");
  });
});
