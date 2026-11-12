import { describe, expect, it } from "vitest";
import { isOneOf } from "./isOneOf";

const COLORS = ["red", "green"] as const;

describe("isOneOf", () => {
  it("accepts a value of the list", () => {
    expect(isOneOf(COLORS, "green")).toBe(true);
  });

  it.each(["blue", "", "Red", "toString"])("refuses %j", (value) => {
    expect(isOneOf(COLORS, value)).toBe(false);
  });
});
