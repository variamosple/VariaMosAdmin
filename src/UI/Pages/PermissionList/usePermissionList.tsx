import {
  createPermission,
  deletePermission,
  queryPermissions,
  updatePermission,
} from "@/DataProviders/PermissionRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "@/Domain/Permission/Entity/PermissionsFilter";
import { useToast } from "@/UI/Context/ToastContext";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { useEffect, useState } from "react";

export const usePermissionList = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditPermission, setToEditPermission] = useState<Permission>();
  const [toDeletePermission, setToDeletePermission] = useState<Permission>();
  const { pushToast } = useToast();

  const {
    data: permissions,
    currentPage,
    loadData,
    isLoading,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<PermissionsFilter, Permission>({
    queryFunction: queryPermissions,
    initialFilter: new PermissionsFilter(),
  });

  useEffect(() => {
    loadData(new PermissionsFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Permission query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  }, [loadData, pushToast]);

  const onPermissionCreate = (permission: Permission) => {
    setIsCreating(true);
    return createPermission(permission)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowCreate(false);
          pushToast({
            title: "Permission create",
            message: "Permission created successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Permission create",
            message: response.message!,
            variant: "danger",
          });
        }

        return response;
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const onPermissionEdit = (permission: Permission) => {
    setToEditPermission(permission);
    setShowEdit(true);
  };

  const performEditPermission = (permission: Permission) => {
    setIsEditing(true);
    return updatePermission(permission)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowEdit(false);

          pushToast({
            title: "Permission edit",
            message: "Permission updated successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Permission edit",
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

  const performDeletePermission = (permission: Permission) => {
    pushToast({
      title: "Role delete",
      message: "Deleting role...",
    });

    deletePermission(permission.id!).then((response) => {
      // alertify.dismissAll();

      if (response.errorCode) {
        pushToast({
          title: "Role delete",
          message: response.message!,
          variant: "danger",
        });
      } else {
        pushToast({
          title: "Role delete",
          message: "Role deleted successfully",
          variant: "success",
        });
        onPageChange(currentPage);
      }
    });
  };

  const onPermissionDelete = (permission: Permission) => {
    setToDeletePermission(permission);
    setShowDelete(true);
  };

  const onSearchReset = () => {
    loadData(new PermissionsFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Permission query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  const onSearchSubmit = (search?: string) => {
    loadData(new PermissionsFilter(search)).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Permission query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  return {
    showCreate,
    setShowCreate,
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    isCreating,
    isEditing,
    toEditPermission,
    toDeletePermission,
    setToDeletePermission,
    permissions,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    onPermissionCreate,
    onPermissionEdit,
    performEditPermission,
    performDeletePermission,
    onPermissionDelete,
    onSearchReset,
    onSearchSubmit,
  };
};
