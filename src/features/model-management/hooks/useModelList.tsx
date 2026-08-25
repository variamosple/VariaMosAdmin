import { usePaginatedQuery } from "@variamosple/variamos-components";
import { useEffect, useState } from "react";
import { queryLanguages } from "@/features/language-management/api/LanguageRepository";
import { LanguagesFilter } from "@/features/language-management/domain/Entity/LanguageFilter";
import {
  createModel,
  deleteModel,
  queryModels,
  updateModel,
} from "@/features/model-management/api/ModelRepository";
import type { Model } from "@/features/model-management/domain/Entity/Model";
import { ModelsFilter } from "@/features/model-management/domain/Entity/ModelFilter";
import { queryProjects } from "@/features/project-management/api/ProjectRepository";
import { ProjectsFilter } from "@/features/project-management/domain/Entity/ProjectFilter";
import { useToast } from "@/shared/context/ToastContext";

export const useModelList = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [toEditModel, setToEditModel] = useState<Model>();
  const [toDeleteModel, setToDeleteModel] = useState<Model>();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>(
    [],
  );
  const { pushToast } = useToast();

  const {
    data: models,
    currentPage,
    loadData,
    isLoading,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<ModelsFilter, Model>({
    queryFunction: queryModels,
    initialFilter: new ModelsFilter(),
  });

  useEffect(() => {
    loadData(new ModelsFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Model query error",
          message: response.message ?? "An error occurred",
          variant: "danger",
        });
      }
    });
  }, [loadData, pushToast]);

  useEffect(() => {
    queryProjects(new ProjectsFilter()).then((res) => {
      if (!res.errorCode && res.data) {
        setProjects(
          res.data.map((p) => ({ id: p.id || "", name: p.name || "" })),
        );
      }
    });
    queryLanguages(new LanguagesFilter()).then((res) => {
      if (!res.errorCode && res.data) {
        setLanguages(
          res.data.map((l) => ({ id: l.id || 0, name: l.name || "" })),
        );
      }
    });
  }, []);

  const onModelEdit = (model: Model) => {
    setToEditModel(model);
    setShowEdit(true);
  };

  const performEditModel = (model: Model) => {
    setIsEditing(true);
    return updateModel(model)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowEdit(false);

          pushToast({
            title: "Model edit",
            message: "Model updated successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Model edit",
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

  const performCreateModel = (model: Model) => {
    setIsCreating(true);
    return createModel(model)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowCreate(false);

          pushToast({
            title: "Model create",
            message: "Model created successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Model create",
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

  const performDeleteModel = (model: Model) => {
    pushToast({
      title: "Model delete",
      message: "Deleting model...",
    });

    if (model.id !== undefined) {
      deleteModel(model.id).then((response) => {
        if (response.errorCode) {
          pushToast({
            title: "Model delete",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        } else {
          pushToast({
            title: "Model delete",
            message: "Model deleted successfully",
            variant: "success",
          });
          onPageChange(currentPage);
        }
      });
    }
  };

  const onModelDelete = (model: Model) => {
    setToDeleteModel(model);
    setShowDelete(true);
  };

  const onSearchReset = () => {
    loadData(new ModelsFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Model query error",
          message: response.message ?? "An error occurred",
          variant: "danger",
        });
      }
    });
  };

  const onSearchSubmit = (search?: ModelsFilter) => {
    loadData(
      new ModelsFilter(
        search?.name,
        search?.modelLevel,
        search?.isDeleted,
        search?.includeDeleted,
        search?.isPublic,
      ),
    ).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Model query error",
          message: response.message ?? "An error occurred",
          variant: "danger",
        });
      }
    });
  };

  const performToggleModelLevel = (model: Model) => {
    const nextLevel =
      model.modelLevel === "application" ? "domain" : "application";
    const updatedModel = { ...model, modelLevel: nextLevel };
    return updateModel(updatedModel).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
        pushToast({
          title: "Model level updated",
          message: `Model level successfully updated to ${nextLevel === "application" ? "Application Model" : "Domain Model"}.`,
          variant: "success",
        });
      } else {
        pushToast({
          title: "Model level update failed",
          message: response.message ?? "An error occurred",
          variant: "danger",
        });
      }
      return response;
    });
  };

  const performToggleModelVisibility = (model: Model) => {
    const nextVisibility = !model.isPublic;
    const updatedModel = { ...model, isPublic: nextVisibility };
    return updateModel(updatedModel).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
        pushToast({
          title: "Model visibility updated",
          message: `Model visibility successfully updated to ${nextVisibility ? "Public" : "Private"}.`,
          variant: "success",
        });
      } else {
        pushToast({
          title: "Model visibility update failed",
          message: response.message ?? "An error occurred",
          variant: "danger",
        });
      }
      return response;
    });
  };

  return {
    showEdit,
    setShowEdit,
    showCreate,
    setShowCreate,
    showDelete,
    setShowDelete,
    isEditing,
    isCreating,
    toEditModel,
    toDeleteModel,
    setToDeleteModel,
    models,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    onModelEdit,
    performEditModel,
    performCreateModel,
    performDeleteModel,
    onModelDelete,
    onModelToggleLevel: performToggleModelLevel,
    onModelToggleVisibility: performToggleModelVisibility,
    onSearchReset,
    onSearchSubmit,
    projects,
    languages,
  };
};
