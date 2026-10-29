import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/shared/context/ToastContext";
import * as ConfigurationRepository from "../api/ConfigurationRepository";
import type { Configuration } from "../domain/Entity/Configuration";
import { ConfigurationListPage } from "./ConfigurationListPage";

vi.mock("@variamosple/variamos-components", async () => ({
  withPageVisit: <T,>(component: T): T => component,
  ResponseModel: class ResponseModel<T> {
    errorCode?: number;
    message?: string;
    data?: T;
    type: string;
    constructor(type: string) {
      this.type = type;
    }
    withError(code: number, msg: string) {
      this.errorCode = code;
      this.message = msg;
      return this;
    }
  },
}));

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

  it("names the sensitive settings before saving them", async () => {
    const user = await renderPage();
    await user.click(
      screen.getByLabelText("Toggle setting general.allow_sign_up"),
    );

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/sensitive settings: general\.allow_sign_up/),
    ).toBeInTheDocument();
    expect(ConfigurationRepository.updateConfiguration).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );
    await waitFor(() =>
      expect(ConfigurationRepository.updateConfiguration).toHaveBeenCalledWith(
        "general.allow_sign_up",
        false,
      ),
    );
  });

  it("saves a setting that is not sensitive without asking", async () => {
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
});
