import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ScheduledChange } from "../domain/Entity/ScheduledChange";
import { ScheduledChangesPanel } from "./ScheduledChangesPanel";

const change = (extra: Partial<ScheduledChange>): ScheduledChange => ({
  id: 1,
  key: "security.password.min_length",
  previousValue: 8,
  newValue: 12,
  dueAt: "2026-11-15T13:00:00.000Z",
  status: "scheduled",
  reason: null,
  createdBy: "admin-1",
  updatedBy: null,
  createdAt: "2026-11-11T12:00:00.000Z",
  updatedAt: "2026-11-11T12:00:00.000Z",
  resolvedAt: null,
  ...extra,
});

const PLANNED = change({});
const CONFLICT = change({
  id: 2,
  key: "security.lockout.max_attempts",
  status: "conflict",
  reason: "The setting was changed after this change was planned.",
  createdBy: "admin-2",
});

describe("ScheduledChangesPanel (EV-115 lot B)", () => {
  it("lists the planned changes with their author, then what became of the others", async () => {
    const onEdit = vi.fn();
    const onCancel = vi.fn();
    render(
      <ScheduledChangesPanel
        changes={[PLANNED, CONFLICT]}
        error={null}
        userId="admin-1"
        canUpdate
        onEdit={onEdit}
        onCancel={onCancel}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Planned changes" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/on 2026-11-15 13:00 UTC/)).toBeInTheDocument();
    expect(screen.getByText(/planned by you/)).toBeInTheDocument();
    expect(screen.getByText("Not applied")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The setting was changed after this change was planned.",
      ),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: "Edit the planned change of security.password.min_length",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Cancel the planned change of security.password.min_length",
      }),
    );
    expect(onEdit).toHaveBeenCalledWith(PLANNED);
    expect(onCancel).toHaveBeenCalledWith(PLANNED);
    // A resolved change is a record: nothing to edit
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("offers no edit to someone who may not change the settings", () => {
    render(
      <ScheduledChangesPanel
        changes={[PLANNED]}
        error={null}
        userId="admin-2"
        canUpdate={false}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/planned by another administrator/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows nothing without changes, and says when they could not be loaded", () => {
    const { container, rerender } = render(
      <ScheduledChangesPanel
        changes={[]}
        error={null}
        canUpdate
        onEdit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <ScheduledChangesPanel
        changes={[]}
        error="The planned changes could not be loaded."
        canUpdate
        onEdit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByText("The planned changes could not be loaded."),
    ).toBeInTheDocument();
  });
});
