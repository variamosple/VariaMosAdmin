import { act, renderHook } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { loadSiteName, resetSiteName, useSiteName } from "./useSiteName";

const publicSettingsUrl = `${(AppConfig.ADMIN_API_URL || "").replace(/\/$/, "")}/v1/configurations/public`;

type PublicSettingsBody =
  | { data: { siteName: string } }
  | { errorCode: number; message: string };

const serverAnswers = (body: PublicSettingsBody, status = 200) =>
  server.use(
    http.get(publicSettingsUrl, () => HttpResponse.json(body, { status })),
  );

describe("useSiteName (EV-87 lot 2)", () => {
  afterEach(() => {
    act(() => resetSiteName());
    document.title = "VariaMos";
  });

  it("gives VariaMos before the server answers", () => {
    const { result } = renderHook(() => useSiteName());
    expect(result.current).toBe("VariaMos");
  });

  it("gives the configured name, and renames a tab that shows the site name alone", async () => {
    document.title = "VariaMos";
    serverAnswers({ data: { siteName: "VariaMos Lab" } });
    const { result } = renderHook(() => useSiteName());

    await act(() => loadSiteName());

    expect(result.current).toBe("VariaMos Lab");
    expect(document.title).toBe("VariaMos Lab");
  });

  it("leaves a screen title to its page", async () => {
    document.title = "Users — VariaMos";
    serverAnswers({ data: { siteName: "VariaMos Lab" } });

    await act(() => loadSiteName());

    expect(document.title).toBe("Users — VariaMos");
  });

  it.each([
    ["an error", { errorCode: 500, message: "down" }, 500],
    ["an empty name", { data: { siteName: "" } }, 200],
    ["a name too long for a tab", { data: { siteName: "x".repeat(61) } }, 200],
  ])(
    "keeps VariaMos when the server answers %s",
    async (_label, body, status) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      serverAnswers(body, status);
      const { result } = renderHook(() => useSiteName());

      await act(() => loadSiteName());

      expect(result.current).toBe("VariaMos");
      expect(document.title).toBe("VariaMos");
      vi.restoreAllMocks();
    },
  );
});
