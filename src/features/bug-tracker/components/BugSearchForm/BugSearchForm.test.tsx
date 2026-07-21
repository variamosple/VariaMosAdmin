import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { BugSearchForm } from "./index";

describe("BugSearchForm Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnSearchReset = jest.fn();
  const sampleRepos = ["repo-a", "repo-b"];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders basic search fields on local/trash tab", () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
      />,
    );

    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();

    // Repo and Status fields should not be present
    expect(screen.queryByLabelText("Repository")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
  });

  it("renders repository and status fields on github tab", () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="github"
      />,
    );

    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();
    expect(screen.getByLabelText("Repository")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
  });

  it("calls onSearchReset and clears fields on form reset", async () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
      />,
    );

    const nameInput = screen.getByPlaceholderText("Search by name");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(nameInput, "Test Query");
    expect(nameInput).toHaveValue("Test Query");

    // Reset form
    fireEvent.reset(screen.getByTestId("bug-search-form"));
    expect(nameInput).toHaveValue("");
    expect(mockOnSearchReset).toHaveBeenCalledTimes(1);
  });

  it("clears individual field and submits when clear button is clicked", async () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="github"
      />,
    );

    const nameInput = screen.getByPlaceholderText("Search by name");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(nameInput, "Glitch");

    const clearNameBtn = screen.getByTitle("Clear name filter");
    await user.click(clearNameBtn);

    expect(nameInput).toHaveValue("");
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("debounces automatic submission on input changes", async () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
      />,
    );

    const nameInput = screen.getByPlaceholderText("Search by name");

    // Simulate typing
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(nameInput, "Performance issue");

    // Initially not submitted (within 500ms debounce window)
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Advance timers by 400ms - still shouldn't submit
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Advance by remaining 100ms - should trigger submit
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
