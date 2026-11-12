import { renderHook, waitFor } from "@testing-library/react";
import { ResponseModel } from "@variamosple/variamos-components";
import * as PreferencesRepository from "@/shared/api/PreferencesRepository";
import { browserTimeZone } from "@/shared/domain/TimeZone";
import { useTimeZone } from "./useTimeZone";

const answer = (timeZone: string | null) => {
  const response = new ResponseModel<{ timeZone: string | null }>("t");
  response.data = { timeZone };
  return response;
};

describe("useTimeZone (EV-115 lot C)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the time zone chosen in My account", async () => {
    vi.spyOn(PreferencesRepository, "getMyPreferences").mockResolvedValue(
      answer("America/Bogota"),
    );

    const { result } = renderHook(() => useTimeZone());

    await waitFor(() => expect(result.current.timeZone).toBe("America/Bogota"));
    expect(result.current.chosen).toBe("America/Bogota");
  });

  it.each([
    ["none was chosen", answer(null)],
    ["the browser does not know it", answer("Mars/Base")],
    [
      "it cannot be read",
      new ResponseModel<{ timeZone: string | null }>("t").withError(
        500,
        "Your preferences could not be loaded.",
      ),
    ],
  ])("uses the browser's when %s", async (_, response) => {
    const read = vi
      .spyOn(PreferencesRepository, "getMyPreferences")
      .mockResolvedValue(response);

    const { result } = renderHook(() => useTimeZone());

    await waitFor(() => expect(read).toHaveBeenCalledOnce());
    expect(result.current.timeZone).toBe(browserTimeZone());
    expect(result.current.chosen).toBeNull();
  });
});
