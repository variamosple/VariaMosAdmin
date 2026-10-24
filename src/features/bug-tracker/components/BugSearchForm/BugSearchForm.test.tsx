import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { BugSearchForm } from "./index";

describe("BugSearchForm Component", () => {
  const mockOnSubmit = vi.fn();
  const mockOnSearchReset = vi.fn();
  const sampleRepos = ["repo-a", "repo-b"];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders basic search fields on local/trash tab", () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
      />,
    );

    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();

    // Repo and Status fields should not be present
    expect(screen.queryByLabelText("Repository")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
  });

  it("renders repository and status fields on github tab", () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="github"
      />,
    );

    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();
    expect(screen.getByLabelText("Repository")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
  });

  it("calls onSearchReset and clears fields on form reset", async () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
      />,
    );

    const nameInput = screen.getByPlaceholderText("Search by name");
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: null,
    });
    await user.type(nameInput, "Test Query");
    expect(nameInput).toHaveValue("Test Query");

    // Reset form
    fireEvent.reset(screen.getByTestId("bug-search-form"));
    expect(nameInput).toHaveValue("");
    expect(mockOnSearchReset).toHaveBeenCalledTimes(1);
  });

  it("clears individual field and submits when clear button is clicked", async () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="github"
      />,
    );

    const nameInput = screen.getByPlaceholderText("Search by name");
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: null,
    });
    await user.type(nameInput, "Glitch");

    const clearNameBtn = screen.getByTitle("Clear name filter");
    await user.click(clearNameBtn);

    expect(nameInput).toHaveValue("");
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("debounces automatic submission on input changes", async () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
      />,
    );

    const nameInput = screen.getByPlaceholderText("Search by name");

    // Simulate typing
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: null,
    });
    await user.type(nameInput, "Performance issue");

    // Initially not submitted (within 500ms debounce window)
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Advance timers by 400ms - still shouldn't submit
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Advance by remaining 100ms - should trigger submit
    act(() => {
      vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it("filters GitHub bugs by assignee when administrators are given", async () => {
    const assignees = [
      { id: "admin-1", name: "Ana" },
      { id: "admin-2", name: "Ben" },
    ];
    const { rerender } = render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="github"
        assignees={assignees}
      />,
    );
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: null,
    });

    await user.selectOptions(screen.getByLabelText("Assigned to"), "admin-2");
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ assignee: "admin-2" }),
      );
    });

    rerender(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
        assignees={assignees}
      />,
    );
    expect(screen.queryByLabelText("Assigned to")).not.toBeInTheDocument();
  });

  it("has no assignee filter without administrators to choose from", () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="github"
      />,
    );
    expect(screen.queryByLabelText("Assigned to")).not.toBeInTheDocument();
  });

  it("filters by component and priority, critical included, on every tab", async () => {
    render(
      <BugSearchForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        onSearchReset={mockOnSearchReset}
        repos={sampleRepos}
        activeTab="local"
      />,
    );
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: null,
    });

    await user.selectOptions(screen.getByLabelText("Component"), "language");
    await user.selectOptions(screen.getByLabelText("Priority"), "critical");
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          component: "language",
          priority: "critical",
        }),
      );
    });
  });
});
