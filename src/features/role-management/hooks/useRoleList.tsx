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
  type ListSort,
  nextSort,
  readSort,
  sortFields,
} from "@/shared/domain/Entity/ListSort";
import {
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const rolesFromParams = (params: URLSearchParams) => {
  const { sortBy, sortOrder } = readSort(params, ROLE_SORT_FIELDS);
  return new RolesFilter(
    readParam(params, "name"),
    readPage(params),
    undefined,
    sortBy,
    sortOrder,
  );
};

export const useRoleList = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditRole, setToEditRole] = useState<Role>();
  const [toDeleteRole, setToDeleteRole] = useState<Role>();

  const { pushToast, removeToast } = useToast();

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

  const onRoleCreate = (role: Role) => {
    setIsCreating(true);
    return createRole(role)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowCreate(false);
          pushToast({
            title: "Role create",
            message: "Role created successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Role create",
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

  const onRoleEdit = (role: Role) => {
    setToEditRole(role);
    setShowEdit(true);
  };

  const performEditRole = (role: Role) => {
    setIsEditing(true);
    const toastId = pushToast({
      title: "Role edit",
      message: "Updating role...",
    });

    return updateRole(role)
      .then((response) => {
        removeToast(toastId);

        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowEdit(false);

          pushToast({
            title: "Role edit",
            message: "Role updated successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Role edit",
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

  const performDeleteRole = (role: Role) => {
    const toastId = pushToast({
      title: "Role delete",
      message: "Deleting role...",
    });

    if (role.id !== undefined) {
      deleteRole(role.id).then((response) => {
        removeToast(toastId);

        if (response.errorCode) {
          pushToast({
            title: "Role delete",
            message: response.message ?? "An error occurred",
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
    }
  };

  const onRoleDelete = (role: Role) => {
    setToDeleteRole(role);
    setShowDelete(true);
  };

  // The search keeps the sort, and the sort keeps the search
  const rolesFilter = (name?: string, sort?: ListSort<RoleSortField>) => {
    const { sortBy, sortOrder } = sort
      ? sortFields(sort)
      : { sortBy: filter?.sortBy, sortOrder: filter?.sortOrder };
    return new RolesFilter(name, undefined, undefined, sortBy, sortOrder);
  };

  const onSearchReset = () => {
    void loadData(rolesFilter());
  };

  const onSearchSubmit = (search?: string) => {
    void loadData(rolesFilter(search));
  };

  const sort: ListSort<RoleSortField> = {
    by: filter?.sortBy ?? "name",
    order: filter?.sortOrder ?? "asc",
  };
  const onSort = (field: RoleSortField) => {
    void loadData(rolesFilter(filter?.name, nextSort(sort, field)));
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
    toEditRole,
    toDeleteRole,
    setToDeleteRole,
    roles,
    currentPage,
    totalPages,
    isLoading,
    onPageChange,
    onRoleCreate,
    onRoleEdit,
    performEditRole,
    performDeleteRole,
    onRoleDelete,
    onSearchReset,
    sort,
    onSort,
    onSearchSubmit,
  };
};
