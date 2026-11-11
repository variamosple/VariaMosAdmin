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

const answer = (timeZone: string | null) => {
  const response = new ResponseModel<{ timeZone: string | null }>("t");
  response.data = { timeZone };
  return response;
};

describe("TimeZoneSetting (EV-115 lot C)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    pushToast.mockClear();
  });

  it("shows the browser's time zone until one is chosen, then saves the choice", async () => {
    const save = vi
      .spyOn(PreferencesRepository, "updateMyTimeZone")
      .mockResolvedValue(answer("America/Bogota"));
    render(<TimeZoneSetting />);
    const user = userEvent.setup();

    expect(
      await screen.findByText(`Browser time (${browserTimeZone()})`),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.selectOptions(
      screen.getByLabelText("Time zone"),
      "America/Bogota",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("America/Bogota")).toBeInTheDocument();
    expect(save).toHaveBeenCalledWith("America/Bogota");
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Time zone saved" }),
    );
  });

  it("goes back to the browser's time zone with the first choice", async () => {
    vi.spyOn(PreferencesRepository, "getMyPreferences").mockResolvedValue(
      answer("Europe/Paris"),
    );
    const save = vi
      .spyOn(PreferencesRepository, "updateMyTimeZone")
      .mockResolvedValue(answer(null));
    render(<TimeZoneSetting />);
    const user = userEvent.setup();

    expect(await screen.findByText("Europe/Paris")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change" }));
    expect(screen.getByLabelText("Time zone")).toHaveValue("Europe/Paris");
    await user.selectOptions(screen.getByLabelText("Time zone"), "");
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
    render(<TimeZoneSetting />);
    const user = userEvent.setup();

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
