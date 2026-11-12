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

const renderModal = (change?: ScheduledChange, timeZone?: string) => {
  const onSaved = vi.fn();
  render(
    <ScheduleChangeModal
      config={MIN_LENGTH}
      change={change}
      onClose={vi.fn()}
      onSaved={onSaved}
      timeZone={timeZone}
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
    expect(screen.getByText(/^2026-11-15 13:00 UTC\./)).toBeInTheDocument();
    // Without a time zone of its own, nothing to switch to
    expect(
      screen.queryByRole("group", { name: "Time zone of the date" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(PLANNED));
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

  describe("in the time zone of the profile (EV-115 lot C)", () => {
    const typeDue = async (
      user: ReturnType<typeof userEvent.setup>,
      label: string,
      input: string,
    ) => {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), input);
    };

    it("takes a time typed in Bogota and plans its instant in UTC", async () => {
      const schedule = vi
        .spyOn(ScheduledChangeRepository, "scheduleChange")
        .mockResolvedValue(saved());
      const { onSaved, user } = renderModal(PLANNED, "America/Bogota");
      vi.spyOn(ScheduledChangeRepository, "rescheduleChange").mockResolvedValue(
        saved(),
      );

      // The planned 09:00 UTC is 04:00 in Bogota
      await user.click(screen.getByRole("button", { name: "Bogota" }));
      expect(screen.getByLabelText("Apply on (Bogota)")).toHaveValue(
        "2026-11-20T04:00",
      );
      await typeDue(user, "Apply on (Bogota)", "2026-11-20T08:00");
      expect(
        screen.getByText(/^2026-11-20 13:00 UTC · 08:00 Bogota \(UTC−5\)\./),
      ).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Save the planned change" }),
      );

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(PLANNED));
      expect(ScheduledChangeRepository.rescheduleChange).toHaveBeenCalledWith(
        4,
        12,
        "2026-11-20T13:00:00.000Z",
      );
      expect(schedule).not.toHaveBeenCalled();
    });

    it("refuses a time that does not exist when clocks move forward", async () => {
      const schedule = vi.spyOn(ScheduledChangeRepository, "scheduleChange");
      const { user } = renderModal(undefined, "Europe/Paris");

      await user.click(screen.getByRole("button", { name: "Paris" }));
      await typeDue(user, "Apply on (Paris)", "2027-03-28T02:30");
      await user.click(screen.getByRole("button", { name: "Schedule" }));

      expect(
        screen.getAllByText(
          "This time does not exist in Paris: clocks move forward that night.",
        ).length,
      ).toBeGreaterThan(0);
      expect(schedule).not.toHaveBeenCalled();
    });

    it("lets the administrator choose a time that comes twice when clocks move back", async () => {
      const schedule = vi
        .spyOn(ScheduledChangeRepository, "scheduleChange")
        .mockResolvedValue(saved());
      const { user } = renderModal(undefined, "Europe/Paris");

      await user.click(screen.getByRole("button", { name: "Paris" }));
      await typeDue(user, "Apply on (Paris)", "2027-10-31T02:30");
      expect(
        screen.getByLabelText("First time, UTC+2 (2027-10-31 00:30 UTC)"),
      ).toBeChecked();
      await user.click(
        screen.getByLabelText("Second time, UTC+1 (2027-10-31 01:30 UTC)"),
      );
      await user.click(screen.getByRole("button", { name: "Schedule" }));

      await waitFor(() =>
        expect(schedule).toHaveBeenCalledWith(
          "security.password.min_length",
          8,
          "2027-10-31T01:30:00.000Z",
        ),
      );
    });
  });
});
