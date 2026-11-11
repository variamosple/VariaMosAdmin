import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as NotificationsAdminRepository from "@/features/notifications-admin/api/NotificationsAdminRepository";
import * as PreferencesRepository from "@/shared/api/PreferencesRepository";
import { ToastProvider } from "@/shared/context/ToastContext";
import * as ConfigurationRepository from "../api/ConfigurationRepository";
import * as ScheduledChangeRepository from "../api/ScheduledChangeRepository";
import type { Configuration } from "../domain/Entity/Configuration";
import type { ScheduledChange } from "../domain/Entity/ScheduledChange";
import { ConfigurationListPage } from "./ConfigurationListPage";

const session = { user: { id: "admin-1", permissions: [] as string[] } };

vi.mock("@variamosple/variamos-components", async () =>
  (await import("@/shared/tests/mocks/variamosComponents")).variamosComponents({
    useSession: () => session as never,
  }),
);

const toggle = (key: string, requiresMfa: boolean): Configuration => ({
  key,
  value: true,
  type: "boolean",
  category: "general",
  requiresMfa,
  isSecret: false,
  environmentScope: "all",
  isReadOnly: false,
  targetServices: ["all"],
});

const planned = (changes: ScheduledChange[]) => {
  const response = new ResponseModel<ScheduledChange[]>("ok");
  response.data = changes;
  return response;
};

const CONFIGURATIONS = [
  toggle("general.show_banner", false),
  toggle("general.allow_sign_up", true),
];

describe("ConfigurationListPage (UX-14)", () => {
  beforeEach(() => {
    const loaded = new ResponseModel<Configuration[]>("ok");
    loaded.data = CONFIGURATIONS;
    vi.spyOn(ConfigurationRepository, "queryConfigurations").mockResolvedValue(
      loaded,
    );
    vi.spyOn(ConfigurationRepository, "updateConfiguration").mockResolvedValue(
      new ResponseModel<Configuration>("ok"),
    );
    vi.spyOn(
      ScheduledChangeRepository,
      "queryScheduledChanges",
    ).mockResolvedValue(planned([]));
    // No time zone chosen: the browser's
    const preferences = new ResponseModel<{ timeZone: string | null }>("ok");
    preferences.data = { timeZone: null };
    vi.spyOn(PreferencesRepository, "getMyPreferences").mockResolvedValue(
      preferences,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    session.user.permissions = [];
  });

  const renderPage = async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ConfigurationListPage />
      </ToastProvider>,
    );
    await screen.findByText("general.show_banner");
    return user;
  };

  it("asks before discarding the changes", async () => {
    const user = await renderPage();
    await user.click(
      screen.getByLabelText("Toggle setting general.show_banner"),
    );

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(
      screen.getByText(/Discard 1 unsaved change\(s\)\?/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("You have unsaved changes.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Discard" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(
      screen.queryByText("You have unsaved changes."),
    ).not.toBeInTheDocument();
  });

  it("locks a setting that requires a second factor", async () => {
    await renderPage();

    expect(
      screen.getByLabelText("Toggle setting general.allow_sign_up"),
    ).toBeDisabled();
    expect(screen.getByText("LOCKED")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "This setting is locked until a second-factor check is available",
      }),
    ).toBeDisabled();
  });

  it("saves without a dialog", async () => {
    const user = await renderPage();
    await user.click(
      screen.getByLabelText("Toggle setting general.show_banner"),
    );

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(ConfigurationRepository.updateConfiguration).toHaveBeenCalled(),
    );
  });

  it("shows why a setting was not saved, next to it", async () => {
    vi.mocked(ConfigurationRepository.updateConfiguration).mockResolvedValue(
      new ResponseModel<Configuration>("error").withError(
        400,
        "Value is out of range.",
      ),
    );
    const user = await renderPage();
    await user.click(
      screen.getByLabelText("Toggle setting general.show_banner"),
    );

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Not saved: Value is out of range."),
    ).toBeInTheDocument();
    expect(screen.getByText("UNSAVED")).toBeInTheDocument();
  });

  it("shows a tab for each category found, with the unit of a value", async () => {
    const loaded = new ResponseModel<Configuration[]>("ok");
    loaded.data = [
      ...CONFIGURATIONS,
      {
        ...toggle("monitoring.health_check_interval_seconds", false),
        type: "number",
        value: 30,
        category: "monitoring",
        accepts: {
          text: "a whole number of seconds from 5 to 86400",
          min: 5,
          max: 86400,
          unit: "seconds",
        },
      },
    ];
    vi.mocked(ConfigurationRepository.queryConfigurations).mockResolvedValue(
      loaded,
    );
    const user = await renderPage();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "General Options",
      "Monitoring",
    ]);

    await user.click(screen.getByRole("tab", { name: "Monitoring" }));

    expect(
      await screen.findByText("monitoring.health_check_interval_seconds"),
    ).toBeVisible();
    expect(screen.getByText("Monitoring Settings")).toBeInTheDocument();
    expect(screen.getByText("seconds")).toBeInTheDocument();
  });

  it("opens on the first category when there is no general one", async () => {
    const loaded = new ResponseModel<Configuration[]>("ok");
    loaded.data = [
      { ...toggle("security.mfa.enabled", false), category: "security" },
    ];
    vi.mocked(ConfigurationRepository.queryConfigurations).mockResolvedValue(
      loaded,
    );
    render(
      <ToastProvider>
        <ConfigurationListPage />
      </ToastProvider>,
    );

    expect(await screen.findByText("security.mfa.enabled")).toBeVisible();
    expect(
      screen.getByRole("tab", { name: "Security & Passwords" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  describe("announcement of a setting users notice (EV-115 lot A)", () => {
    const announced = () => {
      const saved = new ResponseModel<Configuration>("ok");
      saved.data = {
        ...toggle("general.show_banner", false),
        announcement: {
          title: "Password rules updated",
          body: "Passwords must now contain a special character.",
          note: "Your current password keeps working.",
        },
      };
      vi.mocked(ConfigurationRepository.updateConfiguration).mockResolvedValue(
        saved,
      );
    };
    const saveOne = async () => {
      const user = await renderPage();
      await user.click(
        screen.getByLabelText("Toggle setting general.show_banner"),
      );
      await user.click(screen.getByRole("button", { name: "Save Changes" }));
      return user;
    };

    it("offers the suggested text after the save, and sends nothing on refusal", async () => {
      session.user.permissions = ["admin::notifications::dispatch"];
      announced();
      const dispatch = vi.spyOn(
        NotificationsAdminRepository,
        "dispatchNotification",
      );
      const user = await saveOne();

      expect(
        await screen.findByRole("dialog", { name: "Announce this change?" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Title")).toHaveValue(
        "Password rules updated",
      );
      expect(screen.getByLabelText("Message")).toHaveValue(
        "Passwords must now contain a special character. Your current password keeps working.",
      );

      await user.click(screen.getByRole("button", { name: "Don't announce" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(dispatch).not.toHaveBeenCalled();
    });

    it("offers nothing to someone who may not send notifications", async () => {
      announced();
      await saveOne();

      await waitFor(() =>
        expect(
          ConfigurationRepository.queryConfigurations,
        ).toHaveBeenCalledTimes(2),
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("changes planned for a later date (EV-115 lot B)", () => {
    const MIN_LENGTH: Configuration = {
      ...toggle("general.min_length", false),
      value: 8,
      type: "number",
      announcement: {
        title: "Password rules updated",
        body: "Passwords must now have at least 8 characters.",
      },
    };
    const PLANNED: ScheduledChange = {
      id: 7,
      key: "general.min_length",
      previousValue: 8,
      newValue: 14,
      dueAt: "2030-11-15T13:00:00.000Z",
      status: "scheduled",
      reason: null,
      createdBy: "admin-1",
      updatedBy: null,
      createdAt: "2026-11-11T12:00:00.000Z",
      updatedAt: "2026-11-11T12:00:00.000Z",
      resolvedAt: null,
    };
    const answer = (change: ScheduledChange) => {
      const response = new ResponseModel<ScheduledChange>("ok");
      response.data = change;
      return response;
    };

    beforeEach(() => {
      const loaded = new ResponseModel<Configuration[]>("ok");
      loaded.data = [...CONFIGURATIONS, MIN_LENGTH];
      vi.mocked(ConfigurationRepository.queryConfigurations).mockResolvedValue(
        loaded,
      );
    });

    it("schedules only a setting users notice, for someone who may change it", async () => {
      await renderPage();
      expect(
        screen.queryByRole("button", { name: "Schedule a change" }),
      ).not.toBeInTheDocument();
    });

    it("plans a change, then offers its dated announcement", async () => {
      session.user.permissions = [
        "configurations::update",
        "admin::notifications::dispatch",
      ];
      vi.spyOn(ScheduledChangeRepository, "scheduleChange").mockResolvedValue(
        answer({
          ...PLANNED,
          announcement: {
            title: "Password rules updated",
            body: "From 15 November 2030 at 13:00 UTC, passwords must have at least 14 characters.",
          },
        }),
      );
      const user = await renderPage();

      await user.click(
        screen.getByRole("button", { name: "Schedule a change" }),
      );
      await user.clear(screen.getByLabelText("New value"));
      await user.type(screen.getByLabelText("New value"), "14");
      await user.clear(screen.getByLabelText("Apply on (UTC)"));
      await user.type(
        screen.getByLabelText("Apply on (UTC)"),
        "2030-11-15T13:00",
      );
      vi.mocked(
        ScheduledChangeRepository.queryScheduledChanges,
      ).mockResolvedValue(planned([PLANNED]));
      await user.click(screen.getByRole("button", { name: "Schedule" }));

      expect(
        await screen.findByRole("dialog", { name: "Announce this change?" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Message")).toHaveValue(
        "From 15 November 2030 at 13:00 UTC, passwords must have at least 14 characters.",
      );
      expect(await screen.findByText("CHANGE PLANNED")).toBeInTheDocument();
      expect(ScheduledChangeRepository.scheduleChange).toHaveBeenCalledWith(
        "general.min_length",
        14,
        "2030-11-15T13:00:00.000Z",
      );
    });

    it("cancels a planned change after a confirmation, then offers the correction", async () => {
      session.user.permissions = [
        "configurations::update",
        "admin::notifications::dispatch",
      ];
      vi.mocked(
        ScheduledChangeRepository.queryScheduledChanges,
      ).mockResolvedValue(planned([PLANNED]));
      const cancel = vi
        .spyOn(ScheduledChangeRepository, "cancelScheduledChange")
        .mockResolvedValue(
          answer({
            ...PLANNED,
            status: "cancelled",
            announcement: {
              title: "Planned change cancelled",
              body: "The change to the password rules announced for 15 November 2030 at 13:00 UTC will not happen.",
            },
          }),
        );
      const user = await renderPage();

      await user.click(
        await screen.findByRole("button", {
          name: "Cancel the planned change of general.min_length",
        }),
      );
      expect(cancel).not.toHaveBeenCalled();
      await user.click(
        screen.getByRole("button", { name: "Cancel the change" }),
      );

      expect(
        await screen.findByRole("dialog", { name: "Announce this change?" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Title")).toHaveValue(
        "Planned change cancelled",
      );
      expect(cancel).toHaveBeenCalledWith(7);
    });

    it("says why a cancellation failed, and offers nothing to announce", async () => {
      session.user.permissions = [
        "configurations::update",
        "admin::notifications::dispatch",
      ];
      vi.mocked(
        ScheduledChangeRepository.queryScheduledChanges,
      ).mockResolvedValue(planned([PLANNED]));
      vi.spyOn(
        ScheduledChangeRepository,
        "cancelScheduledChange",
      ).mockResolvedValue(
        new ResponseModel<ScheduledChange>("ko").withError(
          400,
          "This change is no longer planned.",
        ),
      );
      const user = await renderPage();

      await user.click(
        await screen.findByRole("button", {
          name: "Cancel the planned change of general.min_length",
        }),
      );
      await user.click(
        screen.getByRole("button", { name: "Cancel the change" }),
      );

      expect(
        await screen.findByText("This change is no longer planned."),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("dialog", { name: "Announce this change?" }),
      ).not.toBeInTheDocument();
    });
  });
});
