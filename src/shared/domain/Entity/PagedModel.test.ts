import { describe, expect, it } from "vitest";
import { PagedModel } from "./PagedModel";

describe("PagedModel", () => {
  it("asks for the first page of 20 items by default, as the library model did", () => {
    expect(new PagedModel()).toEqual({ pageNumber: 1, pageSize: 20 });
  });

  it("keeps the page asked for", () => {
    expect(new PagedModel(3, 50)).toEqual({ pageNumber: 3, pageSize: 50 });
  });
});
