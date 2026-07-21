import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSearchForm } from "./index";

describe("LanguageSearchForm Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnSearchReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders search inputs correctly", () => {
    render(
      <LanguageSearchForm
        onSubmit={mockOnSubmit}
        onSearchReset={mockOnSearchReset}
        isLoading={false}
      />,
    );

    expect(screen.getByPlaceholderText("Search by language name")).toBeInTheDocument();
    expect(screen.getByLabelText("Access level")).toBeInTheDocument();
  });

  it("triggers debounced onSubmit when typing in search field", async () => {
    render(
      <LanguageSearchForm
        onSubmit={mockOnSubmit}
        onSearchReset={mockOnSearchReset}
        isLoading={false}
      />,
    );

    const input = screen.getByPlaceholderText("Search by language name");

    // Simulate typing
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(input, "my-query");

    // Ensure it hasn't fired immediately
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Advance time by 500ms
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "my-query" }));
  });

  it("resets search filter when trash button is clicked", async () => {
    render(
      <LanguageSearchForm
        onSubmit={mockOnSubmit}
        onSearchReset={mockOnSearchReset}
        isLoading={false}
      />,
    );

    const input = screen.getByPlaceholderText("Search by language name");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(input, "temp");

    const clearButton = screen.getByTitle("Clear results");
    await user.click(clearButton);

    expect(mockOnSearchReset).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe("");
  });
});
