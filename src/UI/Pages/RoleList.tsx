import { deleteRole, queryRoles } from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { RolesFilter } from "@/Domain/Role/Entity/RolesFilter";
import { RoleList } from "@/UI/Components/RoleList";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { FC, useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../Components/ConfirmationModal";

export const RoleListPage: FC<unknown> = () => {
  const [showDelete, setShowDelete] = useState(false);
  const [toDeleteRole, setToDeleteRole] = useState<Role>();

  const navigate = useNavigate();
  const {
    data: roles,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<RolesFilter, Role>({
    queryFunction: queryRoles,
    initialFilter: new RolesFilter(),
  });

  useEffect(() => {
    loadData(new RolesFilter());
  }, [loadData]);

  const performDeleteRole = (role: Role) => {
    // alertify.notify("Deleting permission...", "info");

    deleteRole(role.id!)
      .then((response) => {
        // alertify.dismissAll();

        if (response.errorCode) {
          // alertify.error(response.message);
        } else {
          // alertify.success("Role deleted successfully");
        }
        onPageChange(1);
      })
      .catch(() => {
        // alertify.error("Error when trying to delete the permission");
      });
  };

  const onRoleDelete = (permission: Role) => {
    setToDeleteRole(permission);
    setShowDelete(true);
  };

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Roles list</h1>

        <div>
          <Button onClick={() => navigate("/roles/create")}>Create Role</Button>
        </div>
      </div>
      <hr />

      <RoleList
        items={roles}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onRoleDelete={onRoleDelete}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the permission?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeleteRole(toDeleteRole!);
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeleteRole(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};
