import {
  deleteModel,
  queryModels,
  updateModel,
} from "@/DataProviders/ModelRepository";
import { Model } from "@/Domain/Model/Model";
import { ModelsFilter } from "@/Domain/Model/ModelFilter";
import { useToast } from "@/UI/Context/ToastContext";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { useEffect, useState } from "react";

export const useModelList = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditModel, setToEditModel] = useState<Model>();
  const [toDeleteModel, setToDeleteModel] = useState<Model>();
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
          message: response.message!,
          variant: "danger",
        });
      }
    });
  }, [loadData, pushToast]);

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

  const performDeleteModel = (model: Model) => {
    pushToast({
      title: "Model delete",
      message: "Deleting model...",
    });

    deleteModel(model.id!).then((response) => {
      // alertify.dismissAll();

      if (response.errorCode) {
        pushToast({
          title: "Model delete",
          message: response.message!,
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
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  const onSearchSubmit = (search?: ModelsFilter) => {
    loadData(new ModelsFilter(search?.name)).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Model query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  return {
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    isEditing,
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
    performDeleteModel,
    onModelDelete,
    onSearchReset,
    onSearchSubmit,
  };
};
