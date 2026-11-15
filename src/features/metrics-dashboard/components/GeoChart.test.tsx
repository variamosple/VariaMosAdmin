import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GeoChart } from "./GeoChart";

// The map follows the width of its frame, which jsdom does not measure
class StillResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("GeoChart", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", StillResizeObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the visits of a year by country, and of another year on demand", async () => {
    render(
      <GeoChart
        metric={{
          id: "yearly_visits",
          title: "Yearly visits",
          chartType: "geo",
          defaultFilter: "2026",
          data: {
            "2025": [["CO", 3]],
            "2026": [
              ["FR", 2],
              ["XX", 1],
            ],
          },
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Yearly visits - 2026" }),
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByText("2025"));
    expect(
      screen.getByRole("heading", { name: "Yearly visits - 2025" }),
    ).toBeInTheDocument();
  });
});
