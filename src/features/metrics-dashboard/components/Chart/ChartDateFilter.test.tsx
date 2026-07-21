import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ChartDateFilter } from "./ChartDateFilter";

const mockFilterChartData = jest.fn();

jest.mock("../../context/ChartContext", () => ({
  useChartContext: () => ({
    filterChartData: mockFilterChartData,
  }),
}));

jest.mock("./ChartDateFilterForm", () => ({
  ChartDateFilterForm: ({ onFilterSubmit }: any) => (
    <div>
      <button
        data-testid="mock-submit-btn"
        onClick={() => onFilterSubmit({ startDate: "2026-01-01", endDate: "2026-01-10" })}
      >
        Submit Filter
      </button>
    </div>
  ),
}));

describe("ChartDateFilter Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the funnel button and opens the filter popover on click", async () => {
    const user = userEvent.setup();
    render(<ChartDateFilter id="test-filter" />);

    // Check funnel button is rendered (uses custom funnel SVG or component, so check by button role)
    const funnelBtn = screen.getByRole("button");
    expect(funnelBtn).toBeInTheDocument();

    // Popover header should not be visible initially
    expect(screen.queryByText("Filter Chart Data")).not.toBeInTheDocument();

    // Click funnel button to open popover
    await user.click(funnelBtn);

    // Popover header should be visible
    expect(await screen.findByText("Filter Chart Data")).toBeInTheDocument();
    expect(screen.getByTestId("mock-submit-btn")).toBeInTheDocument();
  });

  it("submits filter data and closes the popover", async () => {
    const user = userEvent.setup();
    render(<ChartDateFilter id="test-filter" />);

    const funnelBtn = screen.getByRole("button");
    await user.click(funnelBtn);

    // Click mock submit inside popover
    const submitBtn = await screen.findByTestId("mock-submit-btn");
    await user.click(submitBtn);

    // Context filter function should be called
    expect(mockFilterChartData).toHaveBeenCalledWith({
      startDate: "2026-01-01",
      endDate: "2026-01-10",
    });

    // Popover should close
    await waitFor(() => {
      expect(screen.queryByText("Filter Chart Data")).not.toBeInTheDocument();
    });
  });
});
