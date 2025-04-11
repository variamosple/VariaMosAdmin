import {
  deleteProject,
  queryProjects,
  updateProject,
} from "@/DataProviders/ProjectRepository";
import { Project } from "@/Domain/Project/Project";
import { ProjectsFilter } from "@/Domain/Project/ProjectFilter";
import { useToast } from "@/UI/Context/ToastContext";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { useEffect, useState } from "react";

export const useProjectList = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditProject, setToEditProject] = useState<Project>();
  const [toDeleteProject, setToDeleteProject] = useState<Project>();
  const { pushToast } = useToast();

  const {
    data: projects,
    currentPage,
    loadData,
    isLoading,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<ProjectsFilter, Project>({
    queryFunction: queryProjects,
    initialFilter: new ProjectsFilter(),
  });

  useEffect(() => {
    loadData(new ProjectsFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Project query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  }, [loadData, pushToast]);

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
            message: response.message!,
            variant: "danger",
          });
        }

        return response;
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  const performDeleteProject = (project: Project) => {
    pushToast({
      title: "Project delete",
      message: "Deleting role...",
    });

    deleteProject(project.id!).then((response) => {
      // alertify.dismissAll();

      if (response.errorCode) {
        pushToast({
          title: "Project delete",
          message: response.message!,
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
  };

  const onProjectDelete = (project: Project) => {
    setToDeleteProject(project);
    setShowDelete(true);
  };

  const onSearchReset = () => {
    loadData(new ProjectsFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Project query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  const onSearchSubmit = (search?: ProjectsFilter) => {
    loadData(new ProjectsFilter(search?.name, search?.isTemplate)).then(
      (response) => {
        if (response.errorCode) {
          pushToast({
            title: "Project query error",
            message: response.message!,
            variant: "danger",
          });
        }
      }
    );
  };

  return {
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    isEditing,
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
    performDeleteProject,
    onProjectDelete,
    onSearchReset,
    onSearchSubmit,
  };
};
