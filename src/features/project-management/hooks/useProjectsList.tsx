import { useState } from "react";
import {
  createProject,
  deleteProject,
  queryProjects,
  updateProject,
} from "@/features/project-management/api/ProjectRepository";
import type { Project } from "@/features/project-management/domain/Entity/Project";
import { ProjectsFilter } from "@/features/project-management/domain/Entity/ProjectFilter";
import { useToast } from "@/shared/context/ToastContext";
import {
  readBooleanParam,
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const projectsFromParams = (params: URLSearchParams) =>
  new ProjectsFilter(
    readParam(params, "name"),
    readBooleanParam(params, "isTemplate"),
    readBooleanParam(params, "isDeleted"),
    readBooleanParam(params, "includeDeleted"),
    readPage(params),
  );

export const useProjectList = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [toEditProject, setToEditProject] = useState<Project>();
  const [toDeleteProject, setToDeleteProject] = useState<Project>();
  const { pushToast } = useToast();

  const {
    data: projects,
    currentPage,
    loadData,
    filter,
    isLoading,
    totalPages,
    onPageChange,
    listState,
  } = usePagedList<ProjectsFilter, Project>({
    queryFunction: queryProjects,
    initialFilter: new ProjectsFilter(),
  });

  const { restoredFilter, restoreKey } = useListQueryState(
    { filter, currentPage, loadData },
    projectsFromParams,
  );

  const onProjectEdit = (project: Project) => {
    setToEditProject(project);
    setShowEdit(true);
  };

  const performEditProject = (project: Project) => {
    setIsEditing(true);
    return updateProject(project)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowEdit(false);

          pushToast({
            title: "Project edit",
            message: "Project updated successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Project edit",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        }

        return response;
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  const performCreateProject = (project: Project) => {
    setIsCreating(true);
    return createProject(project)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowCreate(false);

          pushToast({
            title: "Project create",
            message: "Project created successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Project create",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        }

        return response;
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const performDeleteProject = (project: Project) => {
    pushToast({
      title: "Project delete",
      message: "Deleting project...",
    });

    if (project.id !== undefined) {
      deleteProject(project.id).then((response) => {
        if (response.errorCode) {
          pushToast({
            title: "Project delete",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        } else {
          pushToast({
            title: "Project delete",
            message: "Project deleted successfully",
            variant: "success",
          });
          onPageChange(currentPage);
        }
      });
    }
  };

  const onProjectDelete = (project: Project) => {
    setToDeleteProject(project);
    setShowDelete(true);
  };

  const onSearchReset = () => {
    void loadData(new ProjectsFilter());
  };

  const onSearchSubmit = (search?: ProjectsFilter) => {
    void loadData(
      new ProjectsFilter(
        search?.name,
        search?.isTemplate,
        search?.isDeleted,
        search?.includeDeleted,
      ),
    );
  };

  return {
    restoredFilter,
    restoreKey,
    listState,
    showEdit,
    setShowEdit,
    showCreate,
    setShowCreate,
    showDelete,
    setShowDelete,
    isEditing,
    isCreating,
    toEditProject,
    toDeleteProject,
    setToDeleteProject,
    projects,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    onProjectEdit,
    performEditProject,
    performCreateProject,
    performDeleteProject,
    onProjectDelete,
    onSearchReset,
    onSearchSubmit,
  };
};
