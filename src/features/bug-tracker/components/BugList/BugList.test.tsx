import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { BugList } from "./index";
import { Bug } from "../../domain/Bug";

const mockBugs: Bug[] = [
  {
    id: "1-abc-123",
    title: "Test Bug 1",
    description: "This is test bug 1",
    priority: "high",
    category: "frontend",
    status: "open",
    githubRepo: "owner/repo",
    gitIssueNumber: 42,
    createdAt: "2026-07-15T12:00:00Z",
  },
  {
    id: "2-def-456",
    title: "Test Bug 2",
    description: "This is test bug 2",
    priority: "medium",
    category: "backend",
    status: "closed",
    createdAt: "2026-07-15T13:00:00Z",
  },
];

describe("BugList Component", () => {
  const mockOnViewDetails = jest.fn();
  const mockOnReject = jest.fn();
  const mockOnRestore = jest.fn();
  const mockOnApprove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a list of bugs correctly", () => {
    render(<BugList items={mockBugs} onViewDetails={mockOnViewDetails} activeTab="github" />);

    // Check titles are rendered
    expect(screen.getByText("Test Bug 1")).toBeInTheDocument();
    expect(screen.getByText("Test Bug 2")).toBeInTheDocument();

    // Check issue number / link is rendered for GitHub bug
    expect(screen.getByText("#42")).toBeInTheDocument();

    // Check priority and status badges
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("displays empty status message when there are no bugs", () => {
    render(<BugList items={[]} onViewDetails={mockOnViewDetails} activeTab="github" />);

    expect(screen.getByText("No bugs found.")).toBeInTheDocument();
  });

  it("calls onViewDetails when clicking the details button", async () => {
    render(<BugList items={mockBugs} onViewDetails={mockOnViewDetails} activeTab="github" />);

    const detailsButtons = screen.getAllByRole("button", { name: /details/i });
    expect(detailsButtons).toHaveLength(2);

    const user = userEvent.setup();
    await user.click(detailsButtons[0]);
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockBugs[0]);
  });

  it("renders Approve and Reject buttons and triggers handlers on local tab", async () => {
    render(
      <BugList
        items={mockBugs}
        onViewDetails={mockOnViewDetails}
        activeTab="local"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const approveButtons = screen.getAllByRole("button", { name: /approve/i });
    const rejectButtons = screen.getAllByRole("button", { name: /reject/i });

    expect(approveButtons).toHaveLength(2);
    expect(rejectButtons).toHaveLength(2);

    const user = userEvent.setup();
    await user.click(approveButtons[0]);
    expect(mockOnApprove).toHaveBeenCalledTimes(1);
    expect(mockOnApprove).toHaveBeenCalledWith(mockBugs[0]);

    await user.click(rejectButtons[1]);
    expect(mockOnReject).toHaveBeenCalledTimes(1);
    expect(mockOnReject).toHaveBeenCalledWith(mockBugs[1].id);
  });

  it("renders Restore button and triggers handler on trash tab", async () => {
    render(
      <BugList
        items={mockBugs}
        onViewDetails={mockOnViewDetails}
        activeTab="trash"
        onRestore={mockOnRestore}
      />,
    );

    const restoreButtons = screen.getAllByRole("button", { name: /restore/i });
    expect(restoreButtons).toHaveLength(2);

    const user = userEvent.setup();
    await user.click(restoreButtons[0]);
    expect(mockOnRestore).toHaveBeenCalledTimes(1);
    expect(mockOnRestore).toHaveBeenCalledWith(mockBugs[0].id);
  });
});
