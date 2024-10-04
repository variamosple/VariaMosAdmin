import {
  queryPermissionById,
  updatePermission,
} from "@/DataProviders/PermissionRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { FC, useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { PermissionForm } from "../Components/PermissionForm";

export const PermissionEditPage: FC<unknown> = () => {
  const { permissionId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permission, setPermission] = useState<Permission>();

  const queryPermission = (permissionSearchId: number) => {
    setIsLoading(true);
    queryPermissionById(permissionSearchId)
      .then((response) => {
        setPermission(response.data);
      })
      .finally(() => setIsLoading(false));
  };

  const onPermissionEdit = (permission: Permission) => {
    if (!permissionId) {
      return;
    }

    permission.id = Number.parseInt(permissionId);

    setIsSaving(true);
    updatePermission(permission)
      .then((response) => {
        if (!response.errorCode) {
          setPermission(response.data);
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  useEffect(() => {
    if (permissionId) {
      queryPermission(Number.parseInt(permissionId));
    }
  }, [permissionId]);

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Edit Permission</h1>

      <hr />

      {!isLoading && (
        <PermissionForm
          defaultValue={permission}
          onPermissionSubmit={onPermissionEdit}
          isLoading={isSaving}
          submitText="Edit permission"
        />
      )}

      {isLoading && (
        <div className="w-100 text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
    </Container>
  );
};
