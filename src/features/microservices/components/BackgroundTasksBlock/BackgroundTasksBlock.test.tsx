import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/shared/tests/mocks/server";
import { BackgroundTasksBlock } from "./index";

const task = (name: string, consecutiveFailures: number) => ({
  name,
  intervalMs: 15 * 60 * 1000,
  running: false,
  lastRunAt: new Date().toISOString(),
  lastSuccessAt: consecutiveFailures ? null : new Date().toISOString(),
  lastFailureAt: consecutiveFailures ? new Date().toISOString() : null,
  consecutiveFailures,
});

const answering = (tasks: ReturnType<typeof task>[]) => {
  let calls = 0;
  server.use(
    http.get("*/v1/background-tasks", () => {
      calls += 1;
      return HttpResponse.json({ data: tasks, totalCount: 1 });
    }),
  );
  return () => calls;
};

describe("BackgroundTasksBlock (ADM-N34)", () => {
  it("lists the tasks that work, without an alert", async () => {
    answering([task("Journals purge", 0)]);
    render(<BackgroundTasksBlock refreshedAt={new Date()} />);

    expect(
      await screen.findByText(
        "Journals purge: last run less than a minute ago.",
      ),
    ).toHaveClass("text-muted");
    expect(
      screen.getByRole("region", { name: "Background tasks" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("raises an alert and puts a failing task first", async () => {
    answering([task("Journals purge", 0), task("Bugs sync", 3)]);
    render(<BackgroundTasksBlock refreshedAt={new Date()} />);

    const alert = await screen.findByRole("alert");
    const items = screen.getAllByRole("listitem");
    expect(
      screen.getByRole("region", { name: "Background tasks" }),
    ).toContainElement(alert);
    expect(items[0]).toHaveTextContent(
      "Bugs sync: failing (3 in a row), never succeeded.",
    );
    expect(items[0]).toHaveClass("text-danger");
  });

  it("shows nothing when the tasks cannot be read", async () => {
    let called = false;
    server.use(
      http.get("*/v1/background-tasks", () => {
        called = true;
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      }),
    );
    const { container } = render(
      <BackgroundTasksBlock refreshedAt={new Date()} />,
    );

    await waitFor(() => expect(called).toBe(true));
    expect(container).toBeEmptyDOMElement();
  });

  it("loads the tasks again with the list", async () => {
    const calls = answering([task("Journals purge", 0)]);
    const { rerender } = render(
      <BackgroundTasksBlock refreshedAt={new Date("2026-11-22T15:00:00Z")} />,
    );
    await waitFor(() => expect(calls()).toBe(1));

    rerender(
      <BackgroundTasksBlock refreshedAt={new Date("2026-11-22T15:00:30Z")} />,
    );

    await waitFor(() => expect(calls()).toBe(2));
  });
});
