import { configItemsSchema } from "./microServiceSchemas";

const item = {
  id: 1,
  serviceName: "variamos_ms_admin",
  key: "cors.allowed_origins",
  value: "[]",
  type: "array",
  isSecret: false,
  isReadOnly: false,
  description: null,
  createdAt: "2026-10-27T10:00:00.000Z",
};

describe("service parameters (EV-97 phase 2)", () => {
  // The global configurations have the "array" and "object" types too
  it("accepts every type of the global configurations", () => {
    expect(configItemsSchema.safeParse([item]).success).toBe(true);
  });

  it("reads a null description as absent", () => {
    expect(configItemsSchema.parse([item])[0]?.description).toBeUndefined();
  });

  it("refuses a secret flag given as text", () => {
    expect(
      configItemsSchema.safeParse([{ ...item, isSecret: "false" }]).success,
    ).toBe(false);
  });
});
