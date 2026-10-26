import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePageTitle } from "./usePageTitle";

describe("usePageTitle", () => {
  afterEach(() => {
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
});
