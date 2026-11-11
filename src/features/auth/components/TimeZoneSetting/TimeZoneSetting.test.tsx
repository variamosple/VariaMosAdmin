import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import * as PreferencesRepository from "@/shared/api/PreferencesRepository";
import { browserTimeZone } from "@/shared/domain/TimeZone";
import { TimeZoneSetting } from "./index";

const pushToast = vi.fn();
vi.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({ pushToast }),
}));

const NOW = new Date("2026-11-15T13:00:00Z");

const answer = (timeZone: string | null) => {
  const response = new ResponseModel<{ timeZone: string | null }>("t");
  response.data = { timeZone };
  return response;
};

const renderSetting = (countryCode?: string) => {
  render(<TimeZoneSetting countryCode={countryCode} now={() => NOW} />);
  return userEvent.setup();
};

describe("TimeZoneSetting (EV-115)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    pushToast.mockClear();
  });

  it("finds a zone by its country, then saves it", async () => {
    const save = vi
      .spyOn(PreferencesRepository, "updateMyTimeZone")
      .mockResolvedValue(answer("America/Bogota"));
    const user = renderSetting();

    expect(
      await screen.findByText(`Browser time (${browserTimeZone()})`),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.type(screen.getByLabelText("Time zone"), "colombia");
    await user.click(
      screen.getByRole("button", { name: "Colombia · Bogota · UTC−5 · 08:00" }),
    );
    expect(
      screen.getByText(/^Selected: Colombia · Bogota · UTC−5 · 08:00\./),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Colombia · Bogota · UTC−5 · 08:00"),
    ).toBeInTheDocument();
    expect(save).toHaveBeenCalledWith("America/Bogota");
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Time zone saved" }),
    );
  });

  it("offers the zones of the country of the profile before any search", async () => {
    const user = renderSetting("CO");

    await user.click(await screen.findByRole("button", { name: "Change" }));

    expect(
      screen.getByRole("button", { name: "Colombia · Bogota · UTC−5 · 08:00" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^The time zones of Colombia; search/),
    ).toBeInTheDocument();
  });

  it("finds a city typed with its accents, and says when nothing matches", async () => {
    const user = renderSetting();

    await user.click(await screen.findByRole("button", { name: "Change" }));
    await user.type(screen.getByLabelText("Time zone"), "São Paulo");
    expect(
      screen.getByRole("button", { name: /^Brazil · Sao Paulo · / }),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Time zone"));
    await user.type(screen.getByLabelText("Time zone"), "atlantis");

    expect(
      screen.getByText("No time zone matches “atlantis”."),
    ).toBeInTheDocument();
  });

  it("shows the first zones of a broad search and says how many there are", async () => {
    const user = renderSetting();

    await user.click(await screen.findByRole("button", { name: "Change" }));
    await user.type(screen.getByLabelText("Time zone"), "america");

    expect(
      screen.getByText(/^40 of \d+ time zones shown; type more words/),
    ).toBeInTheDocument();
    // The browser's, then the first 40
    expect(screen.getByLabelText("Search results").children).toHaveLength(41);
  });

  it("goes back to the browser's time zone", async () => {
    vi.spyOn(PreferencesRepository, "getMyPreferences").mockResolvedValue(
      answer("Europe/Paris"),
    );
    const save = vi
      .spyOn(PreferencesRepository, "updateMyTimeZone")
      .mockResolvedValue(answer(null));
    const user = renderSetting();

    expect(
      await screen.findByText("France · Paris · UTC+1 · 14:00"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.click(
      screen.getByRole("button", {
        name: `Browser time (${browserTimeZone()})`,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(save).toHaveBeenCalledWith(null);
    expect(
      await screen.findByText(`Browser time (${browserTimeZone()})`),
    ).toBeInTheDocument();
  });

  it("keeps the choice open with the reason when it cannot be saved, and cancels", async () => {
    vi.spyOn(PreferencesRepository, "updateMyTimeZone").mockResolvedValue(
      new ResponseModel<{ timeZone: string | null }>("t").withError(
        400,
        "The time zone is unknown.",
      ),
    );
    const user = renderSetting();

    await user.click(await screen.findByRole("button", { name: "Change" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("The time zone is unknown."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Time zone")).not.toBeInTheDocument();
    expect(pushToast).not.toHaveBeenCalled();
  });
});
