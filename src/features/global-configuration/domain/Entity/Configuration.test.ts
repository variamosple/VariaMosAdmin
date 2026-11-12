import { describe, expect, it } from "vitest";
import { valueKindOf } from "./Configuration";

describe("valueKindOf", () => {
  it("shows a boolean as a switch", () => {
    expect(valueKindOf("boolean")).toBe("switch");
  });

  it("shows an object or an array as JSON text", () => {
    expect(valueKindOf("object")).toBe("json");
    expect(valueKindOf("array")).toBe("json");
  });

  it("shows a string or a number in one field", () => {
    expect(valueKindOf("string")).toBe("field");
    expect(valueKindOf("number")).toBe("field");
  });
});
