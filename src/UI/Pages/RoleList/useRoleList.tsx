import {
  createRole,
  deleteRole,
  queryRoles,
  updateRole,
} from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { RolesFilter } from "@/Domain/Role/Entity/RolesFilter";
import { useToast } from "@/UI/Context/ToastContext";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { useEffect, useState } from "react";

export const useRoleList = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditRole, setToEditRole] = useState<Role>();
  const [toDeleteRole, setToDeleteRole] = useState<Role>();

  const { pushToast } = useToast();

  const {
    data: roles,
    currentPage,
    loadData,
    totalPages,
    isLoading,
    onPageChange,
  } = usePaginatedQuery<RolesFilter, Role>({
    queryFunction: queryRoles,
    initialFilter: new RolesFilter(),
  });

  useEffect(() => {
    loadData(new RolesFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Role query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  }, [loadData, pushToast]);

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

  const onRoleEdit = (role: Role) => {
    setToEditRole(role);
    setShowEdit(true);
  };

  const performEditRole = (role: Role) => {
    setIsEditing(true);
    return updateRole(role)
      .then((response) => {
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

  const performDeleteRole = (role: Role) => {
    pushToast({
      title: "Role delete",
      message: "Deleting role...",
    });

    deleteRole(role.id!).then((response) => {
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

  const onRoleDelete = (role: Role) => {
    setToDeleteRole(role);
    setShowDelete(true);
  };

  const onSearchReset = () => {
    loadData(new RolesFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Role query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  const onSearchSubmit = (search?: string) => {
    loadData(new RolesFilter(search)).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Role query error",
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
    onSearchSubmit,
  };
};
