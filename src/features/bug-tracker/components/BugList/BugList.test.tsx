import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(screen.getByText("Test Bug 1")).toBeDefined();
    expect(screen.getByText("Test Bug 2")).toBeDefined();

    // Check issue number / link is rendered for GitHub bug
    expect(screen.getByText("#42")).toBeDefined();

    // Check priority and status badges
    expect(screen.getByText("High")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
    expect(screen.getByText("Open")).toBeDefined();
    expect(screen.getByText("Closed")).toBeDefined();
  });

  it("displays empty status message when there are no bugs", () => {
    render(<BugList items={[]} onViewDetails={mockOnViewDetails} activeTab="github" />);

    expect(screen.getByText("No bugs found.")).toBeDefined();
  });

  it("calls onViewDetails when clicking the details button", () => {
    render(<BugList items={mockBugs} onViewDetails={mockOnViewDetails} activeTab="github" />);

    const detailsButtons = screen.getAllByRole("button", { name: /details/i });
    expect(detailsButtons.length).toBe(2);

    fireEvent.click(detailsButtons[0]);
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockBugs[0]);
  });

  it("renders Approve and Reject buttons and triggers handlers on local tab", () => {
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

    expect(approveButtons.length).toBe(2);
    expect(rejectButtons.length).toBe(2);

    fireEvent.click(approveButtons[0]);
    expect(mockOnApprove).toHaveBeenCalledTimes(1);
    expect(mockOnApprove).toHaveBeenCalledWith(mockBugs[0]);

    fireEvent.click(rejectButtons[1]);
    expect(mockOnReject).toHaveBeenCalledTimes(1);
    expect(mockOnReject).toHaveBeenCalledWith(mockBugs[1].id);
  });

  it("renders Restore button and triggers handler on trash tab", () => {
    render(
      <BugList
        items={mockBugs}
        onViewDetails={mockOnViewDetails}
        activeTab="trash"
        onRestore={mockOnRestore}
      />,
    );

    const restoreButtons = screen.getAllByRole("button", { name: /restore/i });
    expect(restoreButtons.length).toBe(2);

    fireEvent.click(restoreButtons[0]);
    expect(mockOnRestore).toHaveBeenCalledTimes(1);
    expect(mockOnRestore).toHaveBeenCalledWith(mockBugs[0].id);
  });
});
