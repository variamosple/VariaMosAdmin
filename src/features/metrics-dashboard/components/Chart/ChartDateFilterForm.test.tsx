import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChartDateFilterForm } from "./ChartDateFilterForm";

const mockFilterSubmit = vi.fn();

vi.mock("../../context/ChartContext", async () => {
  return {
    useChartContext: () => ({
      isLoading: false,
      chartFilter: { fromDate: "2026-01-01", toDate: "2026-01-05" },
    }),
  };
});

describe("ChartDateFilterForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(
      await screen.findByText("From date is required"),
    ).toBeInTheDocument();
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

  it("sends the first and last day of the chosen month", async () => {
    render(<ChartDateFilterForm onFilterSubmit={mockFilterSubmit} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Period"), "month");
    expect(screen.queryByLabelText("From")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Month"), "2026-02");
    await user.click(screen.getByText("Apply"));

    await waitFor(() => {
      expect(mockFilterSubmit).toHaveBeenCalledWith({
        fromDate: "2026-02-01",
        toDate: "2026-02-28",
      });
    });
  });

  it("sends the whole chosen year", async () => {
    render(<ChartDateFilterForm onFilterSubmit={mockFilterSubmit} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Period"), "year");
    await user.type(screen.getByLabelText("Year"), "2025");
    await user.click(screen.getByText("Apply"));

    await waitFor(() => {
      expect(mockFilterSubmit).toHaveBeenCalledWith({
        fromDate: "2025-01-01",
        toDate: "2025-12-31",
      });
    });
  });

  it("asks for a year before sending anything", async () => {
    render(<ChartDateFilterForm onFilterSubmit={mockFilterSubmit} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Period"), "year");
    await user.click(screen.getByText("Apply"));

    expect(await screen.findByText("Year is required")).toBeInTheDocument();
    expect(mockFilterSubmit).not.toHaveBeenCalled();
  });
});
