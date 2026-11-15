import { projectSchema, projectsSchema } from "./projectSchemas";

// A row as vms_projects sends GET /v1/admin/projects: every empty field is
// null, the date has no time zone, the content is the editor's JSON
const project = {
  id: "p-1",
  name: "Cars",
  description: null,
  project: {
    id: "p-1",
    name: "Cars",
    enable: true,
    productLines: [
      { id: "pl-1", name: "Base", type: "System", domain: "Auto" },
    ],
  },
  author: null,
  source: null,
  date: "2026-02-10T09:15:00",
  template: false,
  isDeleted: false,
  owners: [{ id: "u-1", name: "Ana", email: "ana@example.com" }],
};

describe("projectSchema (EV-97, services of the other teams)", () => {
  it("reads a listed project and keeps its content and date as sent", () => {
    const [parsed] = projectsSchema.parse([project]);

    expect(parsed?.date).toBe("2026-02-10T09:15:00");
    expect(parsed?.description).toBeUndefined();
    expect(parsed?.project?.productLines?.[0]?.name).toBe("Base");
  });

  it("reads a project without content nor owners", () => {
    const parsed = projectSchema.parse({
      ...project,
      project: null,
      owners: null,
      template: null,
    });

    expect(parsed.project).toBeUndefined();
    expect(parsed.owners).toBeUndefined();
    expect(parsed.template).toBeUndefined();
  });

  it("refuses a content that is not an object", () => {
    expect(
      projectSchema.safeParse({ ...project, project: "broken" }).success,
    ).toBe(false);
    expect(projectsSchema.safeParse(project).success).toBe(false);
  });
});
