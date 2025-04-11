import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";

import { Project } from "@/Domain/Project/Project";
import { ProjectsFilter } from "@/Domain/Project/ProjectFilter";
import { PROJECTS_CLIENT } from "../Infrastructure/AxiosConfig";

export const queryProjects = (
  filter: ProjectsFilter
): Promise<ResponseModel<Project[]>> => {
  return PROJECTS_CLIENT.get("/v1/admin/projects", { params: filter })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query project, please try again later.`
        );
      }
    });
};

export const deleteProject = (
  projectId: number
): Promise<ResponseModel<void>> => {
  return PROJECTS_CLIENT.delete(`/v1/admin/projects/${projectId}`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to delete the project, please try again later."
        );
      }
    });
};

export const queryProjectById = (
  projectId: number
): Promise<ResponseModel<Project>> => {
  return PROJECTS_CLIENT.get(`/v1/admin/projects/${projectId}`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to query the project with id: ${projectId}, please try again later.`
        );
      }
    });
};

export const updateProject = (
  request: Project
): Promise<ResponseModel<Project>> => {
  return PROJECTS_CLIENT.put(`/v1/admin/projects/${request.id}`, request)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          `Error when trying to update the project with id: ${request.id}, please try again later.`
        );
      }
    });
};
