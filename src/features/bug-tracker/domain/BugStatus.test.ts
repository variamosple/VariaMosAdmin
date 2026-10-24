import { githubEffect, nextStatuses, statusLabel } from "./BugStatus";

describe("BugStatus", () => {
  it("names the statuses after the specification", () => {
    expect(statusLabel("in_progress")).toBe("In Progress");
    expect(statusLabel("rejected")).toBe("Invalid");
    expect(statusLabel("custom")).toBe("custom");
    expect(statusLabel(undefined)).toBe("Unknown");
  });

  it("offers only the transitions the API accepts", () => {
    expect(nextStatuses("open")).toEqual(["in_progress", "resolved", "closed"]);
    expect(nextStatuses("closed")).toEqual(["open"]);
    // Approval has its own form; the trash has its own actions
    expect(nextStatuses("pending")).toEqual([]);
    expect(nextStatuses("rejected")).toEqual([]);
  });

  it.each([
    ["open", "resolved", "The GitHub issue will be closed."],
    ["closed", "open", "The GitHub issue will be reopened."],
    [
      "resolved",
      "in_progress",
      'The GitHub issue will be reopened and labelled "in progress".',
    ],
    ["open", "in_progress", 'The GitHub issue will be labelled "in progress".'],
    [
      "in_progress",
      "open",
      'The "in progress" label will be removed from the GitHub issue.',
    ],
  ])("tells what %s to %s does on GitHub", (from, to, effect) => {
    expect(githubEffect(from, to)).toBe(effect);
  });
});
