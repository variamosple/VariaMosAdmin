import type { ResponseModel } from "@variamosple/variamos-components";

import type { Project } from "@/features/project-management/domain/Entity/Project";
import type { ProjectsFilter } from "@/features/project-management/domain/Entity/ProjectFilter";
import { noData, parseResponse } from "@/shared/api/parseResponse";
import { toErrorResponse } from "@/shared/api/toErrorResponse";
import { PROJECTS_CLIENT } from "@/shared/infrastructure/AxiosConfig";
import { projectSchema, projectsSchema } from "./projectSchemas";

export const queryProjects = (
  filter: ProjectsFilter,
): Promise<ResponseModel<Project[]>> => {
  const failure = "Error when trying to query project, please try again later.";
  return PROJECTS_CLIENT.get("/v1/admin/projects", { params: filter })
    .then((response) => parseResponse(projectsSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const deleteProject = (
  projectId: string,
): Promise<ResponseModel<void>> => {
  const failure =
    "Error when trying to delete the project, please try again later.";
  return PROJECTS_CLIENT.delete(`/v1/admin/projects/${projectId}`)
    .then((response) => parseResponse(noData, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const updateProject = (
  request: Project,
): Promise<ResponseModel<Project>> => {
  const failure = `Error when trying to update the project with id: ${request.id}, please try again later.`;
  return PROJECTS_CLIENT.put(`/v1/admin/projects/${request.id}`, request)
    .then((response) => parseResponse(projectSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};

export const createProject = (
  request: Project,
): Promise<ResponseModel<Project>> => {
  const failure =
    "Error when trying to create the project, please try again later.";
  return PROJECTS_CLIENT.post("/v1/admin/projects", request)
    .then((response) => parseResponse(projectSchema, response.data, failure))
    .catch((error) => toErrorResponse(error, failure));
};
