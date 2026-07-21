import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BugListPage } from "./BugListPage";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";

// Mock only @variamosple/variamos-components to avoid page visit tracker external side effects
jest.mock("@variamosple/variamos-components", () => ({
  withPageVisit: (component: any) => component,
}));

describe("BugListPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with initial state", async () => {
    render(<BugListPage />);
    expect(screen.getByText("Bugs list")).toBeInTheDocument();

    // Wait for the real API calls to complete via MSW
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);
    expect(screen.getAllByText("Bug Two")).not.toHaveLength(0);
    expect(screen.getByText("Sync GitHub")).toBeInTheDocument();
    expect(screen.getByText("Report a Bug")).toBeInTheDocument();
    expect(screen.getByText("Create GitHub Issue")).toBeInTheDocument();
  });

  it("shows loader spinner initially", async () => {
    render(<BugListPage />);
    expect(screen.getAllByText("Loading bugs...")).not.toHaveLength(0);
    // Wait for the data loading to finish to avoid act warnings from unhandled state updates
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);
  });

  it("shows error alert when error is present", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/bugs", () => {
        return HttpResponse.json(
          { errorCode: "500", message: "Failed to fetch bugs" },
          { status: 500 },
        );
      }),
    );

    render(<BugListPage />);
    expect(await screen.findByText("Failed to fetch bugs")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("triggers sync when sync button is clicked", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    const syncBtn = screen.getByRole("button", { name: /sync github/i });
    await user.click(syncBtn);

    await waitFor(() => {
      expect(syncBtn).not.toBeDisabled();
    });
  });

  it("does not show sync button on other tabs", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    const localTab = screen.getByRole("tab", { name: /local inbox/i });
    await user.click(localTab);

    expect(screen.queryByRole("button", { name: /sync github/i })).not.toBeInTheDocument();
  });

  it("opens User Report Modal when clicking Report a Bug and submits it", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /report a bug/i }));
    expect(screen.getByText(/report a new bug/i)).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/title \*/i), "My Test Bug");
    await user.type(screen.getByLabelText(/description \*/i), "Something is broken");

    // Submit
    await user.click(screen.getByRole("button", { name: /report bug/i }));

    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByText(/report a new bug/i)).not.toBeInTheDocument();
    });
  });

  it("opens Admin Report Modal when clicking Create GitHub Issue and submits it", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /create github issue/i }));
    expect(screen.getByText(/report a github bug/i)).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/title \*/i), "My Admin Issue");
    await user.type(screen.getByLabelText(/description \*/i), "Admin description");
    await user.selectOptions(screen.getByLabelText(/target repository/i), "repo-a");

    // Submit
    await user.click(screen.getByRole("button", { name: /report bug/i }));

    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByText(/report a github bug/i)).not.toBeInTheDocument();
    });
  });

  it("opens details modal, fetches notes and submits a comment", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("*/bugs/local", () => {
        return HttpResponse.json({
          data: [
            {
              id: "local-1",
              title: "Local Bug",
              description: "Desc",
              priority: "medium",
              category: "frontend",
              status: "pending",
            },
          ],
        });
      }),
      http.get("*/bugs/local-1/notes", () => {
        return HttpResponse.json({
          data: [
            {
              id: "note-1",
              body: "Simple comment",
              createdAt: "2026-07-17T13:00:00Z",
              author: { name: "Alice" },
            },
            {
              id: "note-2",
              body: "[Audit] Status changed: open -> closed",
              createdAt: "2026-07-17T14:00:00Z",
            },
          ],
        });
      }),
      http.post("*/bugs/local-1/notes", () => {
        return HttpResponse.json({
          data: true,
        });
      }),
    );

    render(<BugListPage />);
    const localTab = await screen.findByRole("tab", { name: /local inbox/i });
    await user.click(localTab);

    // Wait for local bug row details button
    const detailsButtons = await screen.findAllByRole("button", { name: /details/i });
    await user.click(detailsButtons[0]);

    // Modal elements should be visible
    expect(await screen.findByText(/bug details/i)).toBeInTheDocument();
    expect(screen.getAllByText("Local Bug")).not.toHaveLength(0);
    expect(screen.getAllByText("Desc")).not.toHaveLength(0);
    expect(screen.getByText("Simple comment")).toBeInTheDocument();
    expect(screen.getByText("SYSTEM AUDIT")).toBeInTheDocument();

    // Fill comment and submit
    const textarea = screen.getByPlaceholderText("Write a comment...");
    await user.type(textarea, "New user note");

    const submitCommentBtn = screen.getByRole("button", { name: /add comment/i });
    await user.click(submitCommentBtn);

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("renders closed discussion notice if status is not pending", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);

    // Wait for GitHub bugs to appear
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    const detailsButtons = screen.getAllByRole("button", { name: /details/i });
    await user.click(detailsButtons[0]);

    expect(await screen.findByText(/bug details/i)).toBeInTheDocument();
    expect(
      screen.getByText("This discussion is closed. Please use GitHub to communicate."),
    ).toBeInTheDocument();
  });
});
