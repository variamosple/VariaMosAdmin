import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/shared/context/ToastContext";
import * as ConfigurationRepository from "../api/ConfigurationRepository";
import type { Configuration } from "../domain/Entity/Configuration";
import { ConfigurationListPage } from "./ConfigurationListPage";

vi.mock("@variamosple/variamos-components", async () =>
  (
    await import("@/shared/tests/mocks/variamosComponents")
  ).variamosComponents(),
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
