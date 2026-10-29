import { useState } from "react";
import {
  createPermission,
  deletePermission,
  queryPermissions,
  updatePermission,
} from "@/features/permission-management/api/PermissionRepository";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import {
  type PermissionSortField,
  PermissionsFilter,
} from "@/features/permission-management/domain/Entity/PermissionsFilter";
import { useToast } from "@/shared/context/ToastContext";
import {
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const permissionsFromParams = (params: URLSearchParams) =>
  new PermissionsFilter(
    readParam(params, "name"),
    readPage(params),
    undefined,
    readParam(params, "sortBy") === "id" ? "id" : undefined,
    readParam(params, "sortOrder") === "desc" ? "desc" : undefined,
  );

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
    filter,
    isLoading,
    totalPages,
    onPageChange,
    listState,
  } = usePagedList<PermissionsFilter, Permission>({
    queryFunction: queryPermissions,
    initialFilter: new PermissionsFilter(),
  });

  const { restoredFilter, restoreKey } = useListQueryState(
    { filter, currentPage, loadData },
    permissionsFromParams,
  );

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

  const performDeletePermission = (permission: Permission) => {
    pushToast({
      title: "Permission delete",
      message: "Deleting permission...",
    });

    if (permission.id !== undefined) {
      deletePermission(permission.id).then((response) => {
        // alertify.dismissAll();

        if (response.errorCode) {
          pushToast({
            title: "Permission delete",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        } else {
          pushToast({
            title: "Permission delete",
            message: "Permission deleted successfully",
            variant: "success",
          });
          onPageChange(currentPage);
        }
      });
    }
  };

  const onPermissionDelete = (permission: Permission) => {
    setToDeletePermission(permission);
    setShowDelete(true);
  };

  // The search keeps the sort, and the sort keeps the search
  const onSearchReset = () => {
    void loadData(
      new PermissionsFilter(
        undefined,
        undefined,
        undefined,
        filter?.sortBy,
        filter?.sortOrder,
      ),
    );
  };

  const onSearchSubmit = (search?: string) => {
    void loadData(
      new PermissionsFilter(
        search,
        undefined,
        undefined,
        filter?.sortBy,
        filter?.sortOrder,
      ),
    );
  };

  // A click on the sorted column turns its order; on another column, it
  // sorts by that column, ascending
  const sort = {
    by: filter?.sortBy ?? "name",
    order: filter?.sortOrder ?? "asc",
  } as const;
  const onSort = (field: PermissionSortField) => {
    const order = sort.by === field && sort.order === "asc" ? "desc" : "asc";
    void loadData(
      new PermissionsFilter(
        filter?.name,
        undefined,
        undefined,
        field === "name" ? undefined : field,
        order === "asc" ? undefined : order,
      ),
    );
  };

  return {
    restoredFilter,
    restoreKey,
    listState,
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
    sort,
    onSort,
  };
};
