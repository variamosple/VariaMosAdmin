import {
  createPermission,
  deletePermission,
  queryPermissions,
  updatePermission,
} from "@/DataProviders/PermissionRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "@/Domain/Permission/Entity/PermissionsFilter";
import { FC, useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import ConfirmationModal from "../Components/ConfirmationModal";
import { PermissionFormModal } from "../Components/PermissionFormModal";
import { PermissionList } from "../Components/PermissionList";
import { usePaginatedQuery } from "../Hooks/usePaginatedQuery";

export const PermissionListPage: FC<unknown> = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditPermission, setToEditPermission] = useState<Permission>();
  const [toDeletePermission, setToDeletePermission] = useState<Permission>();

  const {
    data: permissions,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<PermissionsFilter, Permission>({
    queryFunction: queryPermissions,
    initialFilter: new PermissionsFilter(),
  });

  useEffect(() => {
    loadData(new PermissionsFilter());
  }, [loadData]);

  const onPermissionCreate = (permission: Permission) => {
    setIsCreating(true);
    return createPermission(permission)
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowCreate(false);
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
        }

        return response;
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  const performDeletePermission = (permission: Permission) => {
    // alertify.notify("Deleting permission...", "info");

    deletePermission(permission.id!)
      .then((response) => {
        // alertify.dismissAll();

        if (response.errorCode) {
          // alertify.error(response.message);
        } else {
          // alertify.success("Permission deleted successfully");
          onPageChange(currentPage);
        }
      })
      .catch(() => {
        // alertify.error("Error when trying to delete the permission");
      });
  };

  const onPermissionDelete = (permission: Permission) => {
    setToDeletePermission(permission);
    setShowDelete(true);
  };

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Permissions list</h1>

        <div>
          <Button onClick={() => setShowCreate(true)}>Create Permission</Button>
        </div>
      </div>
      <hr />

      <PermissionFormModal
        modalTitle="Crea a Permission"
        showModal={showCreate}
        onClose={() => setShowCreate(false)}
        onPermissionSubmit={onPermissionCreate}
        isLoading={isCreating}
      />

      <PermissionFormModal
        defaultValue={toEditPermission}
        modalTitle="Edit a Permission"
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        onPermissionSubmit={performEditPermission}
        submitText="Edit permission"
        isLoading={isEditing}
      />

      <PermissionList
        items={permissions}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPermissionEdit={onPermissionEdit}
        onPermissionDelete={onPermissionDelete}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the permission?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeletePermission(toDeletePermission!);
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeletePermission(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};
