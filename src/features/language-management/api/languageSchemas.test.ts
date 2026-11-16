import { languageSchema, languagesSchema } from "./languageSchemas";

// A row as variamos_ms_languages sends GET /v1/admin/languages
const language = {
  id: 7,
  name: "Feature model",
  type: "DOMAIN",
  stateAccept: "ACTIVE",
  createdAt: "2026-03-02T10:00:00.000Z",
  updatedAt: "2026-03-04T11:30:00.000Z",
  owners: [
    { id: "u-1", name: "Ana", email: "ana@example.com", accessLevel: "OWNER" },
  ],
};

describe("languageSchema (EV-97, services of the other teams)", () => {
  it("reads a listed language and keeps its dates as sent", () => {
    const [parsed] = languagesSchema.parse([language]);

    expect(parsed?.name).toBe("Feature model");
    expect(parsed?.createdAt).toBe("2026-03-02T10:00:00.000Z");
    expect(parsed?.owners?.[0]?.accessLevel).toBe("OWNER");
  });

  it("reads NULL columns as absent", () => {
    const parsed = languageSchema.parse({
      ...language,
      type: null,
      stateAccept: null,
      owners: [{ id: "u-2", name: null, email: null }],
    });

    expect(parsed.type).toBeUndefined();
    expect(parsed.owners?.[0]?.name).toBeUndefined();
  });

  it("reads the partial language an update answers with", () => {
    expect(
      languageSchema.parse({ id: 7, name: "Renamed", stateAccept: "PENDING" })
        .name,
    ).toBe("Renamed");
  });

  // As production sent it on 2026-11-16: a bigint column comes as text
  it("reads an id sent as text as a number", () => {
    const [parsed] = languagesSchema.parse([{ ...language, id: "399" }]);

    expect(parsed?.id).toBe(399);
  });

  it("refuses a body that is not a list of languages", () => {
    expect(languagesSchema.safeParse({ id: 7 }).success).toBe(false);
    expect(languagesSchema.safeParse([{ id: "seven" }]).success).toBe(false);
    expect(languagesSchema.safeParse([{ id: "7.5" }]).success).toBe(false);
    expect(languagesSchema.safeParse([{ id: 7.5 }]).success).toBe(false);
  });
});
