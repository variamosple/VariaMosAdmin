import type { ResponseModel } from "@variamosple/variamos-components";
import { useState } from "react";
import {
  createPermission,
  deletePermission,
  queryPermissions,
  updatePermission,
} from "@/features/permission-management/api/PermissionRepository";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import {
  PERMISSION_SORT_FIELDS,
  type PermissionSortField,
  PermissionsFilter,
} from "@/features/permission-management/domain/Entity/PermissionsFilter";
import { useToast } from "@/shared/context/ToastContext";
import {
  keptSort,
  type ListSort,
  nextSort,
  readSort,
  shownSort,
} from "@/shared/domain/Entity/ListSort";
import { useListChange } from "@/shared/hooks/useListChange";
import {
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const permissionsFromParams = (params: URLSearchParams) => {
  const { sortBy, sortOrder } = readSort(params, PERMISSION_SORT_FIELDS);
  return new PermissionsFilter({
    name: readParam(params, "name"),
    pageNumber: readPage(params),
    sortBy,
    sortOrder,
  });
};

// The dialogs of the page, and the permission each one is about
const usePermissionDialogs = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toEditPermission, setToEditPermission] = useState<Permission>();
  const [toDeletePermission, setToDeletePermission] = useState<Permission>();

  const onPermissionEdit = (permission: Permission) => {
    setToEditPermission(permission);
    setShowEdit(true);
  };
  const onPermissionDelete = (permission: Permission) => {
    setToDeletePermission(permission);
    setShowDelete(true);
  };

  return {
    showCreate,
    setShowCreate,
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    isCreating,
    setIsCreating,
    isEditing,
    setIsEditing,
    toEditPermission,
    toDeletePermission,
    setToDeletePermission,
    onPermissionEdit,
    onPermissionDelete,
  };
};

type PermissionDialogs = ReturnType<typeof usePermissionDialogs>;

const usePermissionChanges = (
  dialogs: PermissionDialogs,
  refresh: () => void,
) => {
  const { pushToast } = useToast();
  const run = useListChange(refresh);

  const onPermissionCreate = (permission: Permission) =>
    run({
      request: () => createPermission(permission),
      messages: {
        title: "Permission create",
        success: "Permission created successfully",
      },
      onSuccess: () => dialogs.setShowCreate(false),
      setBusy: dialogs.setIsCreating,
    });

  const performEditPermission = (permission: Permission) =>
    run({
      request: () => updatePermission(permission),
      messages: {
        title: "Permission edit",
        success: "Permission updated successfully",
      },
      onSuccess: () => dialogs.setShowEdit(false),
      setBusy: dialogs.setIsEditing,
    });

  const performDeletePermission = (permission: Permission) => {
    pushToast({
      title: "Permission delete",
      message: "Deleting permission...",
    });
    const { id } = permission;
    if (id === undefined) return;
    void run({
      request: () => deletePermission(id),
      messages: {
        title: "Permission delete",
        success: "Permission deleted successfully",
      },
    });
  };

  return { onPermissionCreate, performEditPermission, performDeletePermission };
};

// The search keeps the sort, and the sort keeps the search
const usePermissionSearch = (
  filter: PermissionsFilter | null,
  loadData: (filter: PermissionsFilter) => Promise<ResponseModel<Permission[]>>,
) => {
  const permissionsFilter = (
    name?: string,
    wantedSort?: ListSort<PermissionSortField>,
  ) => new PermissionsFilter({ name, ...keptSort(filter, wantedSort) });

  const sort = shownSort(filter, "name");
  return {
    sort,
    onSort: (field: PermissionSortField) => {
      void loadData(permissionsFilter(filter?.name, nextSort(sort, field)));
    },
    onSearchReset: () => {
      void loadData(permissionsFilter());
    },
    onSearchSubmit: (search?: string) => {
      void loadData(permissionsFilter(search));
    },
  };
};

export const usePermissionList = () => {
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

  const { setIsCreating, setIsEditing, ...dialogs } = usePermissionDialogs();
  const changes = usePermissionChanges(
    { ...dialogs, setIsCreating, setIsEditing },
    () => onPageChange(currentPage),
  );

  return {
    restoredFilter,
    restoreKey,
    listState,
    ...dialogs,
    permissions,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    ...changes,
    ...usePermissionSearch(filter, loadData),
  };
};
