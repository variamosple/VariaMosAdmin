import { render, screen } from "@testing-library/react";
import { BugPriorityBadge } from "./index";

describe("BugPriorityBadge", () => {
  it.each([
    ["low", "Low"],
    ["HIGH", "High"],
    ["critical", "Critical"],
  ])("labels %s as %s", (priority, label) => {
    render(<BugPriorityBadge priority={priority} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("keeps an unknown value as it is", () => {
    render(<BugPriorityBadge priority="urgent" />);
    expect(screen.getByText("urgent")).toBeInTheDocument();
  });
});
