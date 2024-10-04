import { queryRoleById, updateRole } from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { FC, useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { RoleForm } from "../Components/RoleForm";

export const RoleEditPage: FC<unknown> = () => {
  const { roleId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [role, setRole] = useState<Role>();

  const queryRole = (roleSearchId: number) => {
    setIsLoading(true);
    queryRoleById(roleSearchId)
      .then((response) => {
        setRole(response.data);
      })
      .finally(() => setIsLoading(false));
  };

  const onRoleEdit = (role: Role) => {
    if (!roleId) {
      return;
    }

    role.id = Number.parseInt(roleId);

    setIsSaving(true);
    updateRole(role)
      .then((response) => {
        if (!response.errorCode) {
          setRole(response.data);
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  useEffect(() => {
    if (roleId) {
      queryRole(Number.parseInt(roleId));
    }
  }, [roleId]);

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Edit Role</h1>

      <hr />

      {!isLoading && (
        <RoleForm
          defaultValue={role}
          onRoleSubmit={onRoleEdit}
          isLoading={isSaving}
          submitText="Edit role"
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
