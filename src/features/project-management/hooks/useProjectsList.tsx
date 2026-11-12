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
import { useListChange } from "@/shared/hooks/useListChange";
import {
  readBooleanParam,
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const projectsFromParams = (params: URLSearchParams) =>
  new ProjectsFilter({
    name: readParam(params, "name"),
    isTemplate: readBooleanParam(params, "isTemplate"),
    isDeleted: readBooleanParam(params, "isDeleted"),
    includeDeleted: readBooleanParam(params, "includeDeleted"),
    pageNumber: readPage(params),
  });

// The dialogs of the page, and the project each one is about
const useProjectDialogs = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toEditProject, setToEditProject] = useState<Project>();
  const [toDeleteProject, setToDeleteProject] = useState<Project>();

  const onProjectEdit = (project: Project) => {
    setToEditProject(project);
    setShowEdit(true);
  };
  const onProjectDelete = (project: Project) => {
    setToDeleteProject(project);
    setShowDelete(true);
  };

  return {
    showEdit,
    setShowEdit,
    showCreate,
    setShowCreate,
    showDelete,
    setShowDelete,
    isEditing,
    setIsEditing,
    isCreating,
    setIsCreating,
    toEditProject,
    toDeleteProject,
    setToDeleteProject,
    onProjectEdit,
    onProjectDelete,
  };
};

type ProjectDialogs = ReturnType<typeof useProjectDialogs>;

const useProjectChanges = (dialogs: ProjectDialogs, refresh: () => void) => {
  const { pushToast } = useToast();
  const run = useListChange(refresh);

  const performEditProject = (project: Project) =>
    run({
      request: () => updateProject(project),
      messages: {
        title: "Project edit",
        success: "Project updated successfully",
      },
      onSuccess: () => dialogs.setShowEdit(false),
      setBusy: dialogs.setIsEditing,
    });

  const performCreateProject = (project: Project) =>
    run({
      request: () => createProject(project),
      messages: {
        title: "Project create",
        success: "Project created successfully",
      },
      onSuccess: () => dialogs.setShowCreate(false),
      setBusy: dialogs.setIsCreating,
    });

  const performDeleteProject = (project: Project) => {
    pushToast({ title: "Project delete", message: "Deleting project..." });
    const { id } = project;
    if (id === undefined) return;
    void run({
      request: () => deleteProject(id),
      messages: {
        title: "Project delete",
        success: "Project deleted successfully",
      },
    });
  };

  return { performEditProject, performCreateProject, performDeleteProject };
};

export const useProjectList = () => {
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

  const { setIsEditing, setIsCreating, ...dialogs } = useProjectDialogs();
  const changes = useProjectChanges(
    { ...dialogs, setIsEditing, setIsCreating },
    () => onPageChange(currentPage),
  );

  const onSearchReset = () => {
    void loadData(new ProjectsFilter());
  };

  const onSearchSubmit = (search?: ProjectsFilter) => {
    void loadData(
      new ProjectsFilter({
        name: search?.name,
        isTemplate: search?.isTemplate,
        isDeleted: search?.isDeleted,
        includeDeleted: search?.includeDeleted,
      }),
    );
  };

  return {
    restoredFilter,
    restoreKey,
    listState,
    ...dialogs,
    projects,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    ...changes,
    onSearchReset,
    onSearchSubmit,
  };
};
