import { AccessFilter, ActivityFilter } from "./JournalEntry";

describe("journal filters", () => {
  it("start on the first page, 50 entries per page", () => {
    for (const filter of [new ActivityFilter(), new AccessFilter()]) {
      expect(filter.pageNumber).toBe(1);
      expect(filter.pageSize).toBe(50);
    }
  });

  it("keep 50 entries per page whatever the values they are built from", () => {
    const activity = new ActivityFilter({ pageNumber: 3, pageSize: 500 });
    const access = new AccessFilter({ pageNumber: 2, pageSize: 500 });

    expect(activity).toMatchObject({ pageNumber: 3, pageSize: 50 });
    expect(access).toMatchObject({ pageNumber: 2, pageSize: 50 });
  });
});
