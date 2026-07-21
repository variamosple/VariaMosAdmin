import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelSearchForm } from "./index";

// Wrapper helper to use act in newer React Testing Library setups
import { act } from "react";

// Mock @variamosple/variamos-components before any other imports that might use it
jest.mock("@variamosple/variamos-components", () => {
  return {
    PagedModel: class PagedModel {
      pageNumber?: number;
      pageSize?: number;
      constructor(p?: number, s?: number) {
        this.pageNumber = p;
        this.pageSize = s;
      }
    },
  };
});

describe("ModelSearchForm Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnSearchReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders correctly with initial values", () => {
    render(
      <ModelSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
      />,
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by model name or project name")).toBeInTheDocument();
    expect(screen.getByTitle("Clear results")).toBeInTheDocument();
  });

  it("disables clear button when loading", () => {
    render(
      <ModelSearchForm
        onSubmit={mockOnSubmit}
        isLoading={true}
        onSearchReset={mockOnSearchReset}
      />,
    );

    expect(screen.getByTitle("Clear results")).toBeDisabled();
  });

  it("calls onSearchReset and resets name filter when clear button is clicked", async () => {
    render(
      <ModelSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
      />,
    );

    const input = screen.getByPlaceholderText("Search by model name or project name");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(input, "Test Query");
    expect(input).toHaveValue("Test Query");

    const clearBtn = screen.getByTitle("Clear results");
    await user.click(clearBtn);

    expect(input).toHaveValue("");
    expect(mockOnSearchReset).toHaveBeenCalledTimes(1);
  });

  it("debounces submission on input changes", async () => {
    render(
      <ModelSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
      />,
    );

    const input = screen.getByPlaceholderText("Search by model name or project name");

    // Change input
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(input, "A");
    // Fast-forward 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Change input again
    await user.type(input, "B"); // Since we type B, it appends to A -> AB
    // Fast-forward another 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Fast-forward another 200ms (total 500ms from last change)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "AB" }));
    });
  });
});
