import {
  deletePermission,
  queryPermissions,
} from "@/DataProviders/PermissionRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "@/Domain/Permission/Entity/PermissionsFilter";
import { FC, useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../Components/ConfirmationModal";
import { PermissionList } from "../Components/PermissionList";
import { usePaginatedQuery } from "../Hooks/usePaginatedQuery";

export const PermissionListPage: FC<unknown> = () => {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
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

  const performDeletePermission = (permission: Permission) => {
    // alertify.notify("Deleting permission...", "info");

    deletePermission(permission.id!)
      .then((response) => {
        // alertify.dismissAll();

        if (response.errorCode) {
          // alertify.error(response.message);
        } else {
          // alertify.success("Permission deleted successfully");
        }
        onPageChange(1);
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
          <Button onClick={() => navigate("/permissions/create")}>
            Create Permission
          </Button>
        </div>
      </div>
      <hr />

      <PermissionList
        items={permissions}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
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
