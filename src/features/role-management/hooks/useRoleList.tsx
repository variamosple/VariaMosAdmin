import type { ResponseModel } from "@variamosple/variamos-components";
import { useState } from "react";
import {
  createRole,
  deleteRole,
  queryRoles,
  updateRole,
} from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import {
  ROLE_SORT_FIELDS,
  type RoleSortField,
  RolesFilter,
} from "@/features/role-management/domain/Entity/RolesFilter";
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
const rolesFromParams = (params: URLSearchParams) => {
  const { sortBy, sortOrder } = readSort(params, ROLE_SORT_FIELDS);
  return new RolesFilter({
    name: readParam(params, "name"),
    pageNumber: readPage(params),
    sortBy,
    sortOrder,
  });
};

// The dialogs of the page, and the role each one is about
const useRoleDialogs = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toEditRole, setToEditRole] = useState<Role>();
  const [toDeleteRole, setToDeleteRole] = useState<Role>();

  const onRoleEdit = (role: Role) => {
    setToEditRole(role);
    setShowEdit(true);
  };
  const onRoleDelete = (role: Role) => {
    setToDeleteRole(role);
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
    toEditRole,
    toDeleteRole,
    setToDeleteRole,
    onRoleEdit,
    onRoleDelete,
  };
};

type RoleDialogs = ReturnType<typeof useRoleDialogs>;

const useRoleChanges = (dialogs: RoleDialogs, refresh: () => void) => {
  const { pushToast, removeToast } = useToast();
  const run = useListChange(refresh);

  const onRoleCreate = (role: Role) =>
    run({
      request: () => createRole(role),
      messages: { title: "Role create", success: "Role created successfully" },
      onSuccess: () => dialogs.setShowCreate(false),
      setBusy: dialogs.setIsCreating,
    });

  const performEditRole = (role: Role) => {
    const toastId = pushToast({
      title: "Role edit",
      message: "Updating role...",
    });
    return run({
      request: () =>
        updateRole(role).then((response) => {
          removeToast(toastId);
          return response;
        }),
      messages: { title: "Role edit", success: "Role updated successfully" },
      onSuccess: () => dialogs.setShowEdit(false),
      setBusy: dialogs.setIsEditing,
    });
  };

  const performDeleteRole = (role: Role) => {
    const toastId = pushToast({
      title: "Role delete",
      message: "Deleting role...",
    });
    const { id } = role;
    if (id === undefined) return;
    void run({
      request: () =>
        deleteRole(id).then((response) => {
          removeToast(toastId);
          return response;
        }),
      messages: { title: "Role delete", success: "Role deleted successfully" },
    });
  };

  return { onRoleCreate, performEditRole, performDeleteRole };
};

// The search keeps the sort, and the sort keeps the search
const useRoleSearch = (
  filter: RolesFilter | null,
  loadData: (filter: RolesFilter) => Promise<ResponseModel<Role[]>>,
) => {
  const rolesFilter = (name?: string, wantedSort?: ListSort<RoleSortField>) =>
    new RolesFilter({ name, ...keptSort(filter, wantedSort) });

  const sort = shownSort(filter, "name");
  return {
    sort,
    onSort: (field: RoleSortField) => {
      void loadData(rolesFilter(filter?.name, nextSort(sort, field)));
    },
    onSearchReset: () => {
      void loadData(rolesFilter());
    },
    onSearchSubmit: (search?: string) => {
      void loadData(rolesFilter(search));
    },
  };
};

export const useRoleList = () => {
  const {
    data: roles,
    currentPage,
    loadData,
    filter,
    totalPages,
    isLoading,
    onPageChange,
    listState,
  } = usePagedList<RolesFilter, Role>({
    queryFunction: queryRoles,
    initialFilter: new RolesFilter(),
  });

  const { restoredFilter, restoreKey } = useListQueryState(
    { filter, currentPage, loadData },
    rolesFromParams,
  );

  const { setIsCreating, setIsEditing, ...dialogs } = useRoleDialogs();
  const changes = useRoleChanges(
    { ...dialogs, setIsCreating, setIsEditing },
    () => onPageChange(currentPage),
  );

  return {
    restoredFilter,
    restoreKey,
    listState,
    ...dialogs,
    roles,
    currentPage,
    totalPages,
    isLoading,
    onPageChange,
    ...changes,
    ...useRoleSearch(filter, loadData),
  };
};
