import { act, renderHook } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { usePageTitle } from "./usePageTitle";
import { loadSiteName, resetSiteName } from "./useSiteName";

describe("usePageTitle", () => {
  afterEach(() => {
    act(() => resetSiteName());
    document.title = "VariaMos";
  });

  it("names the tab after the screen, and gives the former title back", () => {
    document.title = "VariaMos";
    const { rerender, unmount } = renderHook(
      ({ title }: { title?: string }) => usePageTitle(title),
      { initialProps: { title: "Users" } },
    );
    expect(document.title).toBe("Users — VariaMos");

    rerender({ title: "User Jane Doe" });
    expect(document.title).toBe("User Jane Doe — VariaMos");

    unmount();
    expect(document.title).toBe("VariaMos");
  });

  it("keeps the application name while the title is not known yet", () => {
    document.title = "VariaMos";
    renderHook(() => usePageTitle(undefined));
    expect(document.title).toBe("VariaMos");
  });

  it("follows the site name set on the configuration screen (EV-87 lot 2)", async () => {
    document.title = "VariaMos";
    server.use(
      http.get(
        `${(AppConfig.ADMIN_API_URL || "").replace(/\/$/, "")}/v1/configurations/public`,
        () => HttpResponse.json({ data: { siteName: "VariaMos Lab" } }),
      ),
    );
    const { unmount } = renderHook(() => usePageTitle("Users"));
    expect(document.title).toBe("Users — VariaMos");

    await act(() => loadSiteName());
    expect(document.title).toBe("Users — VariaMos Lab");

    unmount();
    expect(document.title).toBe("VariaMos Lab");
  });
});
