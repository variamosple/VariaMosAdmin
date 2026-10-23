import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";
import { server } from "@/shared/tests/mocks/server";
import type { AccessEntry, ActivityEntry } from "../domain/JournalEntry";
import { JournalPage } from "./JournalPage";

// The real paging hook, paginator and models, without the library styles
// that the global mock avoids: the page is tested as it runs
vi.mock("@variamosple/variamos-components", async () => {
  const dist = "@variamosple/variamos-components/dist";
  const [hook, paginator, paged, response] = await Promise.all([
    import(`${dist}/Hooks/usePaginatedQuery.js`),
    import(`${dist}/Components/Paginator/index.js`),
    import(`${dist}/Model/PagedModel.js`),
    import(`${dist}/Model/ResponseModel.js`),
  ]);
  return {
    usePaginatedQuery: hook.usePaginatedQuery,
    Paginator: paginator.Paginator,
    PagedModel: paged.PagedModel,
    ResponseModel: response.ResponseModel,
    withPageVisit: <T,>(component: T): T => component,
  };
});

const activityEntry = (
  overrides: Partial<ActivityEntry> = {},
): ActivityEntry => ({
  id: "1",
  occurredAt: "2026-10-23T10:00:00.000Z",
  actorId: "user-1",
  actor: { id: "user-1", name: "Ana", email: "ana@example.com" },
  action: "role.update",
  entityType: "role",
  entityId: "7",
  outcome: "success",
  errorCode: null,
  before: { name: "Old name" },
  after: { name: "New name" },
  transactionId: "updateRole",
  ...overrides,
});

const accessEntry: AccessEntry = {
  id: "9",
  occurredAt: "2026-10-23T11:00:00.000Z",
  userId: null,
  user: null,
  event: "access.refused",
  outcome: "failed",
  reason: "forbidden",
  ip: "203.0.113.7",
  method: "GET",
  path: "/v1/users",
  statusCode: 403,
};

/** Answers the journal routes and keeps the query of each request. */
const serveJournals = (
  activity: ActivityEntry[] = [activityEntry()],
  totalCount = activity.length,
) => {
  const requests: { route: string; params: URLSearchParams }[] = [];
  server.use(
    http.get("*/v1/activity-logs", ({ request }) => {
      requests.push({
        route: "activity",
        params: new URL(request.url).searchParams,
      });
      return HttpResponse.json({
        transactionId: "queryActivityLogs",
        data: activity,
        totalCount,
      });
    }),
    http.get("*/v1/access-logs", ({ request }) => {
      requests.push({
        route: "access",
        params: new URL(request.url).searchParams,
      });
      return HttpResponse.json({
        transactionId: "queryAccessLogs",
        data: [accessEntry],
        totalCount: 1,
      });
    }),
  );
  return requests;
};

describe("Journal page (T-24 lot 3)", () => {
  it("shows the activity journal first, without reading the access journal", async () => {
    const requests = serveJournals();

    render(<JournalPage />);

    expect(
      await screen.findByRole("cell", { name: "role.update" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ana (ana@example.com)")).toBeInTheDocument();
    expect(screen.getByText("role 7")).toBeInTheDocument();
    expect(screen.getByText("1 entry, newest first")).toBeInTheDocument();
    expect(requests.map((request) => request.route)).toEqual(["activity"]);
    // First page of fifty; no empty filter is sent
    expect(Object.fromEntries(requests[0].params)).toEqual({
      pageNumber: "1",
      pageSize: "50",
    });
  });

  it("shows the values before and after on demand", async () => {
    const user = userEvent.setup();
    serveJournals();
    render(<JournalPage />);
    await screen.findByRole("cell", { name: "role.update" });
    expect(screen.queryByText(/Old name/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show" }));

    expect(screen.getByText(/Old name/)).toBeInTheDocument();
    expect(screen.getByText(/New name/)).toBeInTheDocument();
    expect(screen.getByText(/updateRole/)).toBeInTheDocument();
  });

  it("names a deleted account by its id", async () => {
    serveJournals([activityEntry({ actorId: "gone-1", actor: null })]);

    render(<JournalPage />);

    expect(
      await screen.findByText("gone-1 (deleted account)"),
    ).toBeInTheDocument();
  });

  it("sends the filters of the form", async () => {
    const user = userEvent.setup();
    const requests = serveJournals();
    render(<JournalPage />);
    await screen.findByRole("cell", { name: "role.update" });

    await user.type(screen.getByLabelText("Account"), "  ana  ");
    await user.selectOptions(screen.getByLabelText("Outcome"), "failed");
    await user.selectOptions(screen.getByLabelText("Action"), "user.disable");
    await user.selectOptions(screen.getByLabelText("Entity"), "user");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(requests).toHaveLength(2));
    expect(Object.fromEntries(requests[1].params)).toEqual({
      pageNumber: "1",
      pageSize: "50",
      user: "ana",
      outcome: "failed",
      action: "user.disable",
      entityType: "user",
    });
  });

  it("sends the period as ISO dates", async () => {
    const user = userEvent.setup();
    const requests = serveJournals();
    render(<JournalPage />);
    await screen.findByRole("cell", { name: "role.update" });

    await user.type(screen.getByLabelText("From"), "2026-10-01T08:30");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].params.get("from")).toBe(
      new Date("2026-10-01T08:30").toISOString(),
    );
  });

  it("reads the next page", async () => {
    const user = userEvent.setup();
    const requests = serveJournals([activityEntry()], 120);
    render(<JournalPage />);
    await screen.findByText("120 entries, newest first");

    await user.click(screen.getByText("2"));

    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].params.get("pageNumber")).toBe("2");
  });

  it("reads the access journal when its tab is opened", async () => {
    const user = userEvent.setup();
    const requests = serveJournals();
    render(<JournalPage />);
    await screen.findByRole("cell", { name: "role.update" });

    await user.click(screen.getByRole("tab", { name: "Access" }));

    expect(
      await screen.findByRole("cell", { name: "access.refused" }),
    ).toBeInTheDocument();
    expect(screen.getByText("203.0.113.7")).toBeInTheDocument();
    expect(screen.getByText("GET /v1/users")).toBeInTheDocument();
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(requests.map((request) => request.route)).toEqual([
      "activity",
      "access",
    ]);
  });

  it("tells an empty journal from a failed read", async () => {
    serveJournals([]);
    const { unmount } = render(<JournalPage />);
    expect(
      await screen.findByText("No entry for these filters."),
    ).toBeInTheDocument();
    unmount();

    server.use(
      http.get("*/v1/activity-logs", () =>
        HttpResponse.json(
          { errorCode: "SYSTEM_ERROR", message: "Internal server error" },
          { status: 500 },
        ),
      ),
    );
    render(<JournalPage />);

    expect(await screen.findByText(SYSTEM_ERROR_MESSAGE)).toBeInTheDocument();
    expect(
      screen.queryByText("No entry for these filters."),
    ).not.toBeInTheDocument();
  });
});
