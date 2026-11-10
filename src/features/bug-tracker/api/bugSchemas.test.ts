import { bugsSchema, notesSchema, userRefsSchema } from "./bugSchemas";

const bug = {
  id: "b-1",
  title: "Crash",
  description: "On save",
  priority: "high",
  status: "pending",
};

describe("bug answers (EV-97 phase 2)", () => {
  it("reads a report without category as an empty category", () => {
    expect(bugsSchema.parse([bug])[0]?.category).toBe("");
  });

  it("keeps a component outside the list, from older reports", () => {
    expect(
      bugsSchema.safeParse([{ ...bug, component: "editor" }]).success,
    ).toBe(true);
  });

  // The name of an account may be NULL in the database
  it("reads an administrator without name as an empty name", () => {
    expect(userRefsSchema.parse([{ id: "u-1", name: null }])[0]?.name).toBe("");
  });

  it.each([
    ["an unknown priority", { priority: "urgent" }],
    ["a missing title", { title: undefined }],
  ])("refuses a report with %s", (_name, change) => {
    expect(bugsSchema.safeParse([{ ...bug, ...change }]).success).toBe(false);
  });

  it("refuses a note id given as text", () => {
    expect(
      notesSchema.safeParse([
        { id: "note-1", body: "Hi", createdAt: "2026-10-27T10:00:00Z" },
      ]).success,
    ).toBe(false);
  });
});
