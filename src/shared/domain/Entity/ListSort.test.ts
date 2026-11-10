import { nextSort, readSort, sortFields } from "./ListSort";

describe("ListSort", () => {
  it("turns the order of the sorted column, and sorts another column ascending", () => {
    expect(nextSort({ by: "name", order: "asc" }, "name")).toEqual({
      by: "name",
      order: "desc",
    });
    expect(nextSort({ by: "name", order: "desc" }, "name")).toEqual({
      by: "name",
      order: "asc",
    });
    expect(nextSort({ by: "name", order: "desc" }, "email")).toEqual({
      by: "email",
      order: "asc",
    });
  });

  it("leaves the default sort out of the filter, to keep the address short", () => {
    expect(sortFields({ by: "name", order: "asc" })).toEqual({
      sortBy: undefined,
      sortOrder: undefined,
    });
    expect(sortFields({ by: "email", order: "desc" })).toEqual({
      sortBy: "email",
      sortOrder: "desc",
    });
  });

  it("reads a known column and order from the address, and ignores the rest", () => {
    const fields = ["id", "name"] as const;

    expect(
      readSort(new URLSearchParams("sortBy=id&sortOrder=desc"), fields),
    ).toEqual({ sortBy: "id", sortOrder: "desc" });
    expect(
      readSort(new URLSearchParams("sortBy=password&sortOrder=up"), fields),
    ).toEqual({ sortBy: undefined, sortOrder: undefined });
  });
});
