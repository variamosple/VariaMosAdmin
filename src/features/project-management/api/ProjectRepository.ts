import type { ResponseModel } from "@variamosple/variamos-components";

import type { Project } from "@/features/project-management/domain/Entity/Project";
import type { ProjectsFilter } from "@/features/project-management/domain/Entity/ProjectFilter";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { PROJECTS_CLIENT } from "@/shared/infrastructure/AxiosConfig";

export const queryProjects = (
  filter: ProjectsFilter,
): Promise<ResponseModel<Project[]>> => {
  return PROJECTS_CLIENT.get("/v1/admin/projects", { params: filter })
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to query project, please try again later.",
      ),
    );
};

export const deleteProject = (
  projectId: string,
): Promise<ResponseModel<void>> => {
  return PROJECTS_CLIENT.delete(`/v1/admin/projects/${projectId}`)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to delete the project, please try again later.",
      ),
    );
};

export const updateProject = (
  request: Project,
): Promise<ResponseModel<Project>> => {
  return PROJECTS_CLIENT.put(`/v1/admin/projects/${request.id}`, request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        `Error when trying to update the project with id: ${request.id}, please try again later.`,
      ),
    );
};

export const createProject = (
  request: Project,
): Promise<ResponseModel<Project>> => {
  return PROJECTS_CLIENT.post("/v1/admin/projects", request)
    .then((response) => response.data)
    .catch((error) =>
      toErrorResponse(
        error,
        "Error when trying to create the project, please try again later.",
      ),
    );
};
