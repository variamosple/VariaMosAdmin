import { describe, expect, it } from "vitest";
import { keyedLines } from "./keyedLines";

describe("keyedLines", () => {
  it("keys each line by its text", () => {
    expect(keyedLines("* Status: open -> closed\nAdmin Comment: ok")).toEqual([
      { key: "1:* Status: open -> closed", line: "* Status: open -> closed" },
      { key: "1:Admin Comment: ok", line: "Admin Comment: ok" },
    ]);
  });

  it("tells identical lines apart by their rank", () => {
    expect(keyedLines("same\nsame\n").map(({ key }) => key)).toEqual([
      "1:same",
      "2:same",
      "1:",
    ]);
  });
});
