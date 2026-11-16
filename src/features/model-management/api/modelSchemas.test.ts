import { modelSchema, modelsSchema } from "./modelSchemas";

// A row as vms_projects sends GET /v1/admin/models: every empty field is null
const model = {
  id: "m-1",
  projectId: "p-1",
  projectName: "Cars",
  engineeringType: null,
  name: "Feature model",
  type: "FeatureModel",
  description: null,
  author: null,
  source: null,
  owners: [{ id: "u-1", name: "Ana", email: "ana@example.com" }],
  isDeleted: false,
  modelLevel: null,
  isPublic: null,
  languageId: null,
};

describe("modelSchema (EV-97, services of the other teams)", () => {
  it("reads a listed model, its nulls as absent", () => {
    const [parsed] = modelsSchema.parse([model]);

    expect(parsed?.name).toBe("Feature model");
    expect(parsed?.description).toBeUndefined();
    expect(parsed?.isPublic).toBeUndefined();
    expect(parsed?.languageId).toBeUndefined();
    expect(parsed?.owners?.[0]?.email).toBe("ana@example.com");
  });

  it("reads a language id sent as text as a number", () => {
    expect(modelSchema.parse({ ...model, languageId: "399" }).languageId).toBe(
      399,
    );
    expect(modelSchema.parse({ ...model, languageId: 399 }).languageId).toBe(
      399,
    );
    expect(
      modelSchema.safeParse({ ...model, languageId: "a language" }).success,
    ).toBe(false);
  });

  it("reads an owner without a name as an empty name", () => {
    const parsed = modelSchema.parse({
      ...model,
      owners: [{ id: "u-2", name: null, email: null }],
    });

    expect(parsed.owners?.[0]?.name).toBe("");
  });

  it("refuses a model without its project or its name", () => {
    expect(modelSchema.safeParse({ ...model, projectId: null }).success).toBe(
      false,
    );
    expect(modelSchema.safeParse({ ...model, name: undefined }).success).toBe(
      false,
    );
  });
});
