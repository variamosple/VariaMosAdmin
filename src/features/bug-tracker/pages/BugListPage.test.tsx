import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";
import { ADMIN_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import { server } from "@/shared/tests/mocks/server";
import { BugListPage } from "./BugListPage";

const givePermissions = (permissions: string[]) =>
  (useSession as import("vitest").Mock).mockReturnValue({
    user: { id: "admin-1", permissions },
  });

describe("BugListPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    givePermissions(["bugs::query", "bugs::update", "bugs::sync"]);
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
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/bugs", () => {
        return HttpResponse.json(
          { errorCode: "500", message: "Failed to fetch bugs" },
          { status: 500 },
        );
      }),
    );

    render(<BugListPage />);
    expect(await screen.findAllByText(SYSTEM_ERROR_MESSAGE)).not.toHaveLength(
      0,
    );
    expect(screen.getAllByRole("button", { name: /retry/i })).not.toHaveLength(
      0,
    );
    consoleSpy.mockRestore();
  });

  it("drops the previous list when a tab fails to load", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("*/bugs/local", () =>
        HttpResponse.json(
          { errorCode: "500", message: "Failed" },
          { status: 500 },
        ),
      ),
    );

    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    await user.click(screen.getByRole("tab", { name: /local inbox/i }));

    expect(await screen.findAllByText(SYSTEM_ERROR_MESSAGE)).not.toHaveLength(
      0,
    );
    expect(screen.queryByText("Bug One")).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("hides the actions the operator has no permission for", async () => {
    const user = userEvent.setup();
    givePermissions(["bugs::query"]);
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    expect(screen.getByText("Report a Bug")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sync github/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create github issue/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /local inbox/i }));
    expect(await screen.findAllByText("Local Bug")).not.toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /^approve$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^reject$/i }),
    ).not.toBeInTheDocument();
  });

  it("shows sync but not the bug actions with bugs::sync alone", async () => {
    givePermissions(["bugs::query", "bugs::sync"]);
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    expect(
      screen.getByRole("button", { name: /sync github/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create github issue/i }),
    ).not.toBeInTheDocument();
  });

  it("changes the status of a GitHub bug from its details", async () => {
    const user = userEvent.setup();
    const sent: { id: string; status?: string }[] = [];
    server.use(
      http.get("*/bugs", () =>
        HttpResponse.json({
          data: [
            {
              id: "gh-1",
              title: "GitHub Bug",
              description: "Desc",
              priority: "high",
              category: "frontend",
              status: "open",
              githubRepo: "owner/repo",
              gitIssueNumber: 12,
            },
          ],
        }),
      ),
      http.post("*/bugs/:bugId/status", async ({ request, params }) => {
        const body = (await request.json()) as { status?: string };
        sent.push({ id: String(params.bugId), status: body.status });
        return HttpResponse.json({ data: { id: params.bugId } });
      }),
    );
    render(<BugListPage />);
    const [details] = await screen.findAllByRole("button", {
      name: /details/i,
    });
    await user.click(details);

    const modal = await screen.findByRole("dialog");
    await user.selectOptions(
      within(modal).getByLabelText("New status"),
      "resolved",
    );
    await user.click(
      within(modal).getByRole("button", { name: "Update status" }),
    );

    await waitFor(() => {
      expect(sent).toEqual([
        expect.objectContaining({ id: "gh-1", status: "resolved" }),
      ]);
    });
    expect(await within(modal).findByText("Resolved")).toBeInTheDocument();
  });

  it("assigns a GitHub bug to administrators from its details", async () => {
    const user = userEvent.setup();
    const sent: { id: string; userIds: string[] }[] = [];
    server.use(
      http.get("*/bugs", () =>
        HttpResponse.json({
          data: [
            {
              id: "gh-1",
              title: "GitHub Bug",
              description: "Desc",
              priority: "high",
              category: "frontend",
              status: "open",
              githubRepo: "owner/repo",
              gitIssueNumber: 12,
              assignedAdmins: [],
            },
          ],
        }),
      ),
      http.put("*/bugs/:bugId/assignees", async ({ request, params }) => {
        const { userIds } = (await request.json()) as { userIds: string[] };
        sent.push({ id: String(params.bugId), userIds });
        return HttpResponse.json({ data: [{ id: "admin-2", name: "Ben" }] });
      }),
    );
    render(<BugListPage />);
    // Each tab renders the list: the GitHub one comes first
    expect(await screen.findAllByText("Unassigned")).not.toHaveLength(0);
    const [details] = screen.getAllByRole("button", { name: /details/i });
    await user.click(details);

    const modal = await screen.findByRole("dialog");
    expect(
      within(modal).getByText("Assigned to:").parentElement,
    ).toHaveTextContent("Assigned to: Nobody");
    await user.click(await within(modal).findByLabelText("Ben"));
    await user.click(
      within(modal).getByRole("button", { name: "Save assignees" }),
    );

    await waitFor(() => {
      expect(sent).toEqual([{ id: "gh-1", userIds: ["admin-2"] }]);
    });
    await waitFor(() => {
      expect(
        within(modal).getByText("Assigned to:").parentElement,
      ).toHaveTextContent("Assigned to: Ben");
    });
    const [githubTable] = screen.getAllByRole("table");
    expect(within(githubTable).getByText("Ben")).toBeInTheDocument();
  });

  it("does not offer a status change without bugs::update", async () => {
    const user = userEvent.setup();
    givePermissions(["bugs::query"]);
    const assignableRequests: string[] = [];
    server.use(
      http.get("*/bugs/assignable-users", ({ request }) => {
        assignableRequests.push(request.url);
        return HttpResponse.json({ data: [] });
      }),
      http.get("*/bugs", () =>
        HttpResponse.json({
          data: [
            {
              id: "gh-1",
              title: "GitHub Bug",
              description: "Desc",
              priority: "high",
              category: "frontend",
              status: "open",
              githubRepo: "owner/repo",
              gitIssueNumber: 12,
            },
          ],
        }),
      ),
    );
    render(<BugListPage />);
    const [details] = await screen.findAllByRole("button", {
      name: /details/i,
    });
    await user.click(details);

    await screen.findByRole("dialog");
    expect(screen.queryByLabelText("New status")).not.toBeInTheDocument();
    expect(screen.queryByText("Assign administrators")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Assigned to")).not.toBeInTheDocument();
    expect(assignableRequests).toEqual([]);
  });

  it("rejects a bug only after confirmation", async () => {
    const user = userEvent.setup();
    const rejected: string[] = [];
    server.use(
      http.post("*/bugs/:id/reject", ({ params }) => {
        rejected.push(String(params.id));
        return HttpResponse.json({ data: { id: params.id } });
      }),
    );
    render(<BugListPage />);
    await user.click(await screen.findByRole("tab", { name: /local inbox/i }));

    const [rejectBtn] = await screen.findAllByRole("button", {
      name: /^reject$/i,
    });
    await user.click(rejectBtn);
    expect(
      screen.getByText(/move "local bug" to the trash bin/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /keep in inbox/i }));
    expect(rejected).toEqual([]);

    await user.click(rejectBtn);
    await user.click(screen.getByRole("button", { name: /reject bug/i }));
    await waitFor(() => {
      expect(rejected).toEqual(["local-1"]);
    });
  });

  it("keeps the report form open with its input when the creation fails", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.post("*/bugs", () =>
        HttpResponse.json(
          { errorCode: "500", message: "Failed" },
          { status: 500 },
        ),
      ),
    );
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /report a bug/i }));
    await user.type(screen.getByLabelText(/title \*/i), "My Test Bug");
    await user.type(screen.getByLabelText(/description \*/i), "Broken");
    await user.click(screen.getByRole("button", { name: /report bug/i }));

    const modal = screen.getByRole("dialog");
    expect(
      await within(modal).findByText(SYSTEM_ERROR_MESSAGE),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title \*/i)).toHaveValue("My Test Bug");
    expect(screen.getByLabelText(/description \*/i)).toHaveValue("Broken");
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

    expect(
      screen.queryByRole("button", { name: /sync github/i }),
    ).not.toBeInTheDocument();
  });

  it("opens User Report Modal when clicking Report a Bug and submits it", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /report a bug/i }));
    expect(screen.getByText(/report a new bug/i)).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/title \*/i), "My Test Bug");
    await user.type(
      screen.getByLabelText(/description \*/i),
      "Something is broken",
    );

    // Submit
    await user.click(screen.getByRole("button", { name: /report bug/i }));

    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByText(/report a new bug/i)).not.toBeInTheDocument();
    });
  });

  it("sends the chosen component with a new report", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /report a bug/i }));
    const modal = await screen.findByRole("dialog");
    await user.type(within(modal).getByLabelText(/title \*/i), "My Test Bug");
    await user.type(within(modal).getByLabelText(/description \*/i), "Broken");
    await user.selectOptions(
      within(modal).getByLabelText("Component"),
      "language",
    );
    // Under jsdom, axios turns FormData into text: the request is read here
    const post = vi
      .spyOn(ADMIN_CLIENT, "post")
      .mockResolvedValueOnce({ data: { data: { id: "new-1" } } });
    await user.click(
      within(modal).getByRole("button", { name: /report bug/i }),
    );

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/bugs", expect.any(FormData));
    });
    expect((post.mock.calls[0][1] as FormData).get("component")).toBe(
      "language",
    );
    post.mockRestore();
  });

  it("opens Admin Report Modal when clicking Create GitHub Issue and submits it", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    await user.click(
      screen.getByRole("button", { name: /create github issue/i }),
    );
    expect(screen.getByText(/report a github bug/i)).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/title \*/i), "My Admin Issue");
    await user.type(
      screen.getByLabelText(/description \*/i),
      "Admin description",
    );
    await user.selectOptions(
      screen.getByLabelText(/target repository/i),
      "repo-a",
    );

    // Submit
    await user.click(
      screen.getByRole("button", { name: /create public github issue/i }),
    );

    // Wait for modal to close
    await waitFor(() => {
      expect(
        screen.queryByText(/report a github bug/i),
      ).not.toBeInTheDocument();
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
    const detailsButtons = await screen.findAllByRole("button", {
      name: /details/i,
    });
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

    const submitCommentBtn = screen.getByRole("button", {
      name: /add comment/i,
    });
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
      screen.getByText(
        "This discussion is closed. Please use GitHub to communicate.",
      ),
    ).toBeInTheDocument();
  });

  it("opens approval modal for a local bug, modifies fields and submits successfully", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);

    // Wait for initial load
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    // Switch to Local tab
    const localTab = screen.getByRole("tab", { name: /local inbox/i });
    await user.click(localTab);

    // Wait for the local bug's approve button to appear
    const approveBtns = await screen.findAllByRole("button", {
      name: /approve/i,
    });
    await user.click(approveBtns[0]);

    // Verify modal elements are populated
    expect(
      screen.getByText("Review and Approve Local Bug"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title \*/i)).toHaveValue("Local Bug");
    expect(screen.getByLabelText(/description \*/i)).toHaveValue("Desc");

    // Modify fields
    await user.clear(screen.getByLabelText(/title \*/i));
    await user.type(
      screen.getByLabelText(/title \*/i),
      "Updated Local Bug Title",
    );

    await user.clear(screen.getByLabelText(/description \*/i));
    await user.type(screen.getByLabelText(/description \*/i), "Updated Desc");

    // Use userEvent.selectOptions for select elements
    await user.selectOptions(
      screen.getByLabelText(/target repository/i),
      "repo-a",
    );
    await user.selectOptions(screen.getByLabelText(/category \*/i), "cat-1");
    await user.selectOptions(screen.getByLabelText(/priority \*/i), "high");

    const commentField = screen.getByPlaceholderText(
      /add details about why this bug is approved/i,
    );
    await user.type(commentField, "Approval comment");

    // Click submit button
    const submitBtn = screen.getByRole("button", {
      name: /approve & send to github/i,
    });
    await user.click(submitBtn);
    await user.click(
      await screen.findByRole("button", { name: /publish to github/i }),
    );

    // Modal should close
    await waitFor(() => {
      expect(
        screen.queryByText("Review and Approve Local Bug"),
      ).not.toBeInTheDocument();
    });
  });

  it("closes the approval modal and resets selected bug state when cancelled", async () => {
    const user = userEvent.setup();
    render(<BugListPage />);

    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    // Switch to Local tab
    const localTab = screen.getByRole("tab", { name: /local inbox/i });
    await user.click(localTab);

    // Wait for the local bug's approve button to appear
    const approveBtns = await screen.findAllByRole("button", {
      name: /approve/i,
    });
    await user.click(approveBtns[0]);

    expect(
      screen.getByText("Review and Approve Local Bug"),
    ).toBeInTheDocument();

    // Click Cancel
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    // Modal should close
    await waitFor(() => {
      expect(
        screen.queryByText("Review and Approve Local Bug"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows error alert and keeps modal open when API submission fails with 500", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    server.use(
      http.post("*/bugs/:bugId/status", () => {
        return HttpResponse.json(
          { errorCode: "500", message: "Failed to approve bug" },
          { status: 500 },
        );
      }),
    );

    render(<BugListPage />);
    expect(await screen.findAllByText("Bug One")).not.toHaveLength(0);

    // Switch to Local tab
    const localTab = screen.getByRole("tab", { name: /local inbox/i });
    await user.click(localTab);

    // Wait for the local bug's approve button to appear
    const approveBtns = await screen.findAllByRole("button", {
      name: /approve/i,
    });
    await user.click(approveBtns[0]);

    // Fill required fields to submit
    await user.selectOptions(
      screen.getByLabelText(/target repository/i),
      "repo-a",
    );
    await user.selectOptions(screen.getByLabelText(/category \*/i), "cat-1");

    // Click submit button
    const submitBtn = screen.getByRole("button", {
      name: /approve & send to github/i,
    });
    await user.click(submitBtn);
    await user.click(
      await screen.findByRole("button", { name: /publish to github/i }),
    );

    // Error message should show inside modal
    const modal = screen.getByRole("dialog");
    expect(
      await within(modal).findByText(SYSTEM_ERROR_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Review and Approve Local Bug"),
    ).toBeInTheDocument(); // still open

    consoleSpy.mockRestore();
  });
});
