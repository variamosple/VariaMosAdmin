import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

    fireEvent.change(fromInput, { target: { value: "" } });
    fireEvent.change(toInput, { target: { value: "" } });

    const submitBtn = screen.getByText("Apply");
    fireEvent.click(submitBtn);

    expect(await screen.findByText("From date is required")).toBeDefined();
    expect(await screen.findByText("To date is required")).toBeDefined();
    expect(mockFilterSubmit).not.toHaveBeenCalled();
  });

  it("should submit new filter values when valid", async () => {
    render(<ChartDateFilterForm onFilterSubmit={mockFilterSubmit} />);

    const fromInput = screen.getByLabelText("From") as HTMLInputElement;
    const toInput = screen.getByLabelText("To") as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: "2026-06-01" } });
    fireEvent.change(toInput, { target: { value: "2026-06-15" } });

    const submitBtn = screen.getByText("Apply");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFilterSubmit).toHaveBeenCalledWith({
        fromDate: "2026-06-01",
        toDate: "2026-06-15",
      });
    });
  });
});
