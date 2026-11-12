import { useCallback, useEffect, useState } from "react";
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
import { useListChange } from "@/shared/hooks/useListChange";
import {
  readBooleanParam,
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const modelsFromParams = (params: URLSearchParams) =>
  new ModelsFilter({
    name: readParam(params, "name"),
    modelLevel: readParam(params, "modelLevel"),
    isDeleted: readBooleanParam(params, "isDeleted"),
    includeDeleted: readBooleanParam(params, "includeDeleted"),
    isPublic: readBooleanParam(params, "isPublic"),
    pageNumber: readPage(params),
  });

// The dialogs of the page, and the model each one is about
const useModelDialogs = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toEditModel, setToEditModel] = useState<Model>();
  const [toDeleteModel, setToDeleteModel] = useState<Model>();

  const onModelEdit = (model: Model) => {
    setToEditModel(model);
    setShowEdit(true);
  };
  const onModelDelete = (model: Model) => {
    setToDeleteModel(model);
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
    toEditModel,
    toDeleteModel,
    setToDeleteModel,
    onModelEdit,
    onModelDelete,
  };
};

type ModelDialogs = ReturnType<typeof useModelDialogs>;

// The projects and languages offered by the model form: the first page,
// then those whose name matches what is typed, searched on the server so
// that one beyond the first page can be chosen (EV-96)
const useModelChoices = () => {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>(
    [],
  );

  const searchProjects = useCallback((name?: string) => {
    void queryProjects(
      new ProjectsFilter({
        name: name || undefined,
      }),
    ).then((res) => {
      if (!res.errorCode && res.data) {
        setProjects(
          res.data.map((p) => ({ id: p.id || "", name: p.name || "" })),
        );
      }
    });
  }, []);

  const searchLanguages = useCallback((name?: string) => {
    void queryLanguages(new LanguagesFilter(name || undefined)).then((res) => {
      if (!res.errorCode && res.data) {
        setLanguages(
          res.data.map((l) => ({ id: l.id || 0, name: l.name || "" })),
        );
      }
    });
  }, []);

  useEffect(() => {
    searchProjects();
    searchLanguages();
  }, [searchProjects, searchLanguages]);

  return { projects, languages, searchProjects, searchLanguages };
};

const levelName = (level: string) =>
  level === "application" ? "Application Model" : "Domain Model";

// The level and the visibility change at once, from the row
const useModelToggles = (refresh: () => void) => {
  const run = useListChange(refresh);

  const onModelToggleLevel = (model: Model) => {
    const nextLevel =
      model.modelLevel === "application" ? "domain" : "application";
    return run({
      request: () => updateModel({ ...model, modelLevel: nextLevel }),
      messages: {
        title: "Model level updated",
        success: `Model level successfully updated to ${levelName(nextLevel)}.`,
        failureTitle: "Model level update failed",
      },
    });
  };

  const onModelToggleVisibility = (model: Model) => {
    const nextVisibility = !model.isPublic;
    return run({
      request: () => updateModel({ ...model, isPublic: nextVisibility }),
      messages: {
        title: "Model visibility updated",
        success: `Model visibility successfully updated to ${nextVisibility ? "Public" : "Private"}.`,
        failureTitle: "Model visibility update failed",
      },
    });
  };

  return { onModelToggleLevel, onModelToggleVisibility };
};

const useModelChanges = (dialogs: ModelDialogs, refresh: () => void) => {
  const { pushToast } = useToast();
  const run = useListChange(refresh);

  const performEditModel = (model: Model) =>
    run({
      request: () => updateModel(model),
      messages: { title: "Model edit", success: "Model updated successfully" },
      onSuccess: () => dialogs.setShowEdit(false),
      setBusy: dialogs.setIsEditing,
    });

  const performCreateModel = (model: Model) =>
    run({
      request: () => createModel(model),
      messages: {
        title: "Model create",
        success: "Model created successfully",
      },
      onSuccess: () => dialogs.setShowCreate(false),
      setBusy: dialogs.setIsCreating,
    });

  const performDeleteModel = (model: Model) => {
    pushToast({ title: "Model delete", message: "Deleting model..." });
    const { id } = model;
    if (id === undefined) return;
    void run({
      request: () => deleteModel(id),
      messages: {
        title: "Model delete",
        success: "Model deleted successfully",
      },
    });
  };

  return {
    performEditModel,
    performCreateModel,
    performDeleteModel,
    ...useModelToggles(refresh),
  };
};

export const useModelList = () => {
  const {
    data: models,
    currentPage,
    loadData,
    filter,
    isLoading,
    totalPages,
    onPageChange,
    listState,
  } = usePagedList<ModelsFilter, Model>({
    queryFunction: queryModels,
    initialFilter: new ModelsFilter(),
  });

  const { restoredFilter, restoreKey } = useListQueryState(
    { filter, currentPage, loadData },
    modelsFromParams,
  );

  const { setIsEditing, setIsCreating, ...dialogs } = useModelDialogs();
  const changes = useModelChanges(
    { ...dialogs, setIsEditing, setIsCreating },
    () => onPageChange(currentPage),
  );

  const onSearchReset = () => {
    void loadData(new ModelsFilter());
  };

  const onSearchSubmit = (search?: ModelsFilter) => {
    void loadData(
      new ModelsFilter({
        name: search?.name,
        modelLevel: search?.modelLevel,
        isDeleted: search?.isDeleted,
        includeDeleted: search?.includeDeleted,
        isPublic: search?.isPublic,
      }),
    );
  };

  return {
    restoredFilter,
    restoreKey,
    listState,
    ...dialogs,
    models,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    ...changes,
    onSearchReset,
    onSearchSubmit,
    ...useModelChoices(),
  };
};
