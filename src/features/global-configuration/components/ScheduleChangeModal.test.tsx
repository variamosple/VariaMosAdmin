import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import * as ScheduledChangeRepository from "../api/ScheduledChangeRepository";
import type { Configuration } from "../domain/Entity/Configuration";
import type { ScheduledChange } from "../domain/Entity/ScheduledChange";
import { ScheduleChangeModal } from "./ScheduleChangeModal";

vi.mock("@variamosple/variamos-components", async () =>
  (
    await import("@/shared/tests/mocks/variamosComponents")
  ).variamosComponents(),
);

const NOW = new Date("2026-11-11T12:00:00Z");

const MIN_LENGTH: Configuration = {
  key: "security.password.min_length",
  value: 8,
  type: "number",
  category: "security",
  requiresMfa: false,
  isSecret: false,
  environmentScope: "all",
  isReadOnly: false,
  targetServices: ["all"],
  accepts: { text: "a whole number from 8 to 128", min: 8, max: 128 },
};

const PLANNED = {
  id: 4,
  key: MIN_LENGTH.key,
  newValue: 12,
  dueAt: "2026-11-20T09:00:00.000Z",
} as ScheduledChange;

const saved = () => {
  const response = new ResponseModel<ScheduledChange>("t");
  response.data = PLANNED;
  return response;
};

const renderModal = (change?: ScheduledChange) => {
  const onSaved = vi.fn();
  render(
    <ScheduleChangeModal
      config={MIN_LENGTH}
      change={change}
      onClose={vi.fn()}
      onSaved={onSaved}
      now={() => NOW}
    />,
  );
  return { onSaved, user: userEvent.setup() };
};

describe("ScheduleChangeModal (EV-115 lot B)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("plans the new value for a date typed in UTC", async () => {
    const schedule = vi
      .spyOn(ScheduledChangeRepository, "scheduleChange")
      .mockResolvedValue(saved());
    const { onSaved, user } = renderModal();

    expect(
      screen.getByRole("dialog", { name: "Schedule a change" }),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText("New value"));
    await user.type(screen.getByLabelText("New value"), "14");
    await user.clear(screen.getByLabelText("Apply on (UTC)"));
    await user.type(
      screen.getByLabelText("Apply on (UTC)"),
      "2026-11-15T13:00",
    );
    expect(screen.getByText(/^Your time: /)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(schedule).toHaveBeenCalledWith(
      "security.password.min_length",
      14,
      "2026-11-15T13:00:00.000Z",
    );
  });

  it("refuses a past date or a value that is not a whole number, before asking the server", async () => {
    const schedule = vi.spyOn(ScheduledChangeRepository, "scheduleChange");
    const { user } = renderModal();

    await user.clear(screen.getByLabelText("Apply on (UTC)"));
    await user.type(
      screen.getByLabelText("Apply on (UTC)"),
      "2026-11-10T13:00",
    );
    await user.click(screen.getByRole("button", { name: "Schedule" }));
    expect(
      screen.getByText("The date of the change must be in the future."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("New value"));
    await user.click(screen.getByRole("button", { name: "Schedule" }));
    expect(
      screen.getByText("Enter a whole number from 8 to 128."),
    ).toBeInTheDocument();
    expect(schedule).not.toHaveBeenCalled();
  });

  it("edits a planned change from its value and date, and shows a refusal", async () => {
    const reschedule = vi
      .spyOn(ScheduledChangeRepository, "rescheduleChange")
      .mockResolvedValue(
        new ResponseModel<ScheduledChange>("t").withError(
          400,
          "This change is no longer planned.",
        ),
      );
    const { onSaved, user } = renderModal(PLANNED);

    expect(screen.getByLabelText("New value")).toHaveValue(12);
    expect(screen.getByLabelText("Apply on (UTC)")).toHaveValue(
      "2026-11-20T09:00",
    );
    await user.click(
      screen.getByRole("button", { name: "Save the planned change" }),
    );

    expect(
      await screen.findByText("This change is no longer planned."),
    ).toBeInTheDocument();
    expect(reschedule).toHaveBeenCalledWith(4, 12, "2026-11-20T09:00:00.000Z");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
