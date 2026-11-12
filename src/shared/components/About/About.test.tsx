import { screen } from "@testing-library/react";
import { renderWithUser } from "@/shared/tests/render";
import { About } from "./index";

describe("About", () => {
  it("shows the first tab and the tutorials", () => {
    renderWithUser(<About />);

    expect(
      screen.getByRole("heading", { name: "How it works" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Product line engineering (PLE)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Model driven engineering (MDE)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("VariaMos Language Definition"),
    ).toBeInTheDocument();
  });

  it.each([
    ["Version 1.0", "VariaMos (Variability Models) V1.0."],
    ["Version 2.0", "Version 2.0. Java Stand Alone"],
    ["Version 3.0", "Version 3.0. VueJS Web Application"],
    ["Version 4.0", "Version 4.0. A microservices-based Web Application"],
  ])("loads the %s tab when it is opened", async (tab, heading) => {
    const { user } = renderWithUser(<About />);
    expect(screen.queryByRole("heading", { name: heading })).toBeNull();

    await user.click(screen.getByRole("tab", { name: tab }));

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });
});
