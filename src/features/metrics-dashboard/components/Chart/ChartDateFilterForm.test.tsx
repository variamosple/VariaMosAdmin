import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChartDateFilterForm } from "./ChartDateFilterForm";

const mockFilterSubmit = jest.fn();

jest.mock("../../context/ChartContext", () => {
  return {
    useChartContext: () => ({
      isLoading: false,
      chartFilter: { fromDate: "2026-01-01", toDate: "2026-01-05" },
    }),
  };
});

describe("ChartDateFilterForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render default values from context", () => {
    render(<ChartDateFilterForm onFilterSubmit={mockFilterSubmit} />);

    const fromInput = screen.getByLabelText("From") as HTMLInputElement;
    const toInput = screen.getByLabelText("To") as HTMLInputElement;

    expect(fromInput.value).toBe("2026-01-01");
    expect(toInput.value).toBe("2026-01-05");
  });

  it("should trigger validation when dates are cleared and submitted", async () => {
    render(<ChartDateFilterForm onFilterSubmit={mockFilterSubmit} />);

    const fromInput = screen.getByLabelText("From") as HTMLInputElement;
    const toInput = screen.getByLabelText("To") as HTMLInputElement;

    const user = userEvent.setup();
    await user.clear(fromInput);
    await user.clear(toInput);

    const submitBtn = screen.getByText("Apply");
    await user.click(submitBtn);

    expect(await screen.findByText("From date is required")).toBeInTheDocument();
    expect(await screen.findByText("To date is required")).toBeInTheDocument();
    expect(mockFilterSubmit).not.toHaveBeenCalled();
  });

  it("should submit new filter values when valid", async () => {
    render(<ChartDateFilterForm onFilterSubmit={mockFilterSubmit} />);

    const fromInput = screen.getByLabelText("From") as HTMLInputElement;
    const toInput = screen.getByLabelText("To") as HTMLInputElement;

    const user = userEvent.setup();
    await user.clear(fromInput);
    await user.type(fromInput, "2026-06-01");
    await user.clear(toInput);
    await user.type(toInput, "2026-06-15");

    const submitBtn = screen.getByText("Apply");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockFilterSubmit).toHaveBeenCalledWith({
        fromDate: "2026-06-01",
        toDate: "2026-06-15",
      });
    });
  });
});
