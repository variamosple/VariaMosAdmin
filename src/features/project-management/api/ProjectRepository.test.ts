import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import type { Project } from "../domain/Entity/Project";
import { ProjectsFilter } from "../domain/Entity/ProjectFilter";
import {
  createProject,
  deleteProject,
  queryProjects,
  updateProject,
} from "./ProjectRepository";

const projectsApi = (path: string) =>
  `${(AppConfig.PROJECTS_API_URL || "").replace(/\/$/, "")}${path}`;

// As vms_projects answers: every empty field of its ResponseModel is null
const pythonEnvelope = <T>(data: T) => ({
  transactionId: "ProjectsAdmin",
  errorCode: null,
  message: null,
  totalCount: null,
  data,
});

const project: Project = {
  id: "p-1",
  name: "Cars",
  date: "2026-02-10T09:15:00",
};

describe("ProjectRepository (EV-97, services of the other teams)", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("reads the projects of a Python answer", async () => {
    server.use(
      http.get(projectsApi("/v1/admin/projects"), () =>
        HttpResponse.json(
          pythonEnvelope([{ ...project, project: null, owners: null }]),
        ),
      ),
    );

    const response = await queryProjects(new ProjectsFilter());

    expect(response.errorCode).toBeFalsy();
    expect(response.data?.[0]?.date).toBe("2026-02-10T09:15:00");
    expect(response.data?.[0]?.owners).toBeUndefined();
  });

  it("gives an error, not a broken list, for a body of the wrong shape", async () => {
    server.use(
      http.get(projectsApi("/v1/admin/projects"), () =>
        HttpResponse.json(pythonEnvelope([{ ...project, id: 1 }])),
      ),
    );

    const response = await queryProjects(new ProjectsFilter());

    expect(response.errorCode).toBe(500);
    expect(response.message).toBe(
      "Error when trying to query project, please try again later.",
    );
  });

  it("reads the project an update or a creation answers with", async () => {
    server.use(
      http.put(projectsApi("/v1/admin/projects/p-1"), async ({ request }) =>
        HttpResponse.json(pythonEnvelope(await request.json())),
      ),
      http.post(projectsApi("/v1/admin/projects"), async ({ request }) =>
        HttpResponse.json(pythonEnvelope(await request.json())),
      ),
    );

    expect((await updateProject(project)).data?.name).toBe("Cars");
    expect((await createProject(project)).data?.id).toBe("p-1");
  });

  it("passes on the error vms_projects answers with a success status", async () => {
    server.use(
      http.delete(projectsApi("/v1/admin/projects/p-9"), () =>
        HttpResponse.json({
          ...pythonEnvelope(null),
          errorCode: 404,
          message: "Project not found",
        }),
      ),
      http.delete(projectsApi("/v1/admin/projects/p-1"), () =>
        HttpResponse.json(pythonEnvelope(null)),
      ),
    );

    expect((await deleteProject("p-9")).message).toBe("Project not found");
    expect((await deleteProject("p-1")).errorCode).toBeFalsy();
  });

  it("says the service cannot be reached, for each call", async () => {
    server.use(
      http.all(projectsApi("/v1/admin/projects*"), () => HttpResponse.error()),
    );

    const responses = await Promise.all([
      queryProjects(new ProjectsFilter()),
      updateProject(project),
      createProject(project),
      deleteProject("p-1"),
    ]);

    for (const response of responses) {
      expect(response.errorCode).toBeTruthy();
    }
  });
});
