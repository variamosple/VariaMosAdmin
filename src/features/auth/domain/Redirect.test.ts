import { describe, expect, it } from "vitest";
import { safeRedirectOf } from "./Redirect";

describe("safeRedirectOf", () => {
  it("keeps web addresses and paths of this site", () => {
    expect(safeRedirectOf("https://variamos.example/#/users")).toBe(
      "https://variamos.example/#/users",
    );
    expect(safeRedirectOf("http://localhost:3000/")).toBe(
      "http://localhost:3000/",
    );
    expect(safeRedirectOf("/users")).toBe("/users");
  });

  it("drops addresses that would run a script or open a document", () => {
    expect(safeRedirectOf("javascript:alert(1)")).toBeUndefined();
    expect(safeRedirectOf(" JavaScript:alert(1)")).toBeUndefined();
    expect(safeRedirectOf("data:text/html,<p>x</p>")).toBeUndefined();
    expect(safeRedirectOf("vbscript:x")).toBeUndefined();
  });

  it("drops a missing or unreadable address", () => {
    expect(safeRedirectOf(undefined)).toBeUndefined();
    expect(safeRedirectOf("")).toBeUndefined();
    expect(safeRedirectOf("http://[bad")).toBeUndefined();
  });
});
