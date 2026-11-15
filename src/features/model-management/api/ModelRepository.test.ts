import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import type { Model } from "../domain/Entity/Model";
import { ModelsFilter } from "../domain/Entity/ModelFilter";
import {
  createModel,
  deleteModel,
  queryModels,
  updateModel,
} from "./ModelRepository";

const projectsApi = (path: string) =>
  `${(AppConfig.PROJECTS_API_URL || "").replace(/\/$/, "")}${path}`;

// As vms_projects answers: every empty field of its ResponseModel is null
const pythonEnvelope = <T>(data: T) => ({
  transactionId: "ModelsAdmin",
  errorCode: null,
  message: null,
  totalCount: null,
  data,
});

const model: Model = { id: "m-1", projectId: "p-1", name: "Feature model" };

describe("ModelRepository (EV-97, services of the other teams)", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("reads the models of a Python answer", async () => {
    server.use(
      http.get(projectsApi("/v1/admin/models"), () =>
        HttpResponse.json({
          ...pythonEnvelope([{ ...model, description: null }]),
          totalCount: 1,
        }),
      ),
    );

    const response = await queryModels(new ModelsFilter());

    expect(response.errorCode).toBeFalsy();
    expect(response.totalCount).toBe(1);
    expect(response.data?.[0]?.description).toBeUndefined();
  });

  it("gives an error, not a broken list, for a body of the wrong shape", async () => {
    server.use(
      http.get(projectsApi("/v1/admin/models"), () =>
        HttpResponse.json(pythonEnvelope([{ id: "m-1" }])),
      ),
    );

    const response = await queryModels(new ModelsFilter());

    expect(response.errorCode).toBe(500);
    expect(response.message).toBe(
      "Error when trying to query model, please try again later.",
    );
  });

  it("reads the model an update or a creation answers with", async () => {
    server.use(
      http.put(projectsApi("/v1/admin/models/m-1"), async ({ request }) =>
        HttpResponse.json(pythonEnvelope(await request.json())),
      ),
      http.post(projectsApi("/v1/admin/models"), async ({ request }) =>
        HttpResponse.json(pythonEnvelope(await request.json())),
      ),
    );

    expect((await updateModel(model)).data?.name).toBe("Feature model");
    expect((await createModel(model)).data?.projectId).toBe("p-1");
  });

  it("passes on the error vms_projects answers with a success status", async () => {
    server.use(
      http.delete(projectsApi("/v1/admin/models/m-9"), () =>
        HttpResponse.json({
          ...pythonEnvelope(null),
          errorCode: 404,
          message: "Model not found",
        }),
      ),
      http.delete(projectsApi("/v1/admin/models/m-1"), () =>
        HttpResponse.json(pythonEnvelope(null)),
      ),
    );

    expect((await deleteModel("m-9")).message).toBe("Model not found");
    expect((await deleteModel("m-1")).errorCode).toBeFalsy();
  });

  it("says the service cannot be reached, for each call", async () => {
    server.use(
      http.all(projectsApi("/v1/admin/models*"), () => HttpResponse.error()),
    );

    const responses = await Promise.all([
      queryModels(new ModelsFilter()),
      updateModel(model),
      createModel(model),
      deleteModel("m-1"),
    ]);

    for (const response of responses) {
      expect(response.errorCode).toBeTruthy();
    }
  });
});
