import {
  createRole,
  deleteRole,
  queryRoles,
  updateRole,
} from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { RolesFilter } from "@/Domain/Role/Entity/RolesFilter";
import { RoleList } from "@/UI/Components/RoleList";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { FC, useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import ConfirmationModal from "../Components/ConfirmationModal";
import { RoleFormModal } from "../Components/RoleFormModal";

export const RoleListPage: FC<unknown> = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditRole, setToEditRole] = useState<Role>();
  const [toDeleteRole, setToDeleteRole] = useState<Role>();

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

  const onRoleCreate = (role: Role) => {
    setIsCreating(true);
    return createRole(role)
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
        }

        return response;
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  const performDeleteRole = (role: Role) => {
    // alertify.notify("Deleting role...", "info");

    deleteRole(role.id!)
      .then((response) => {
        // alertify.dismissAll();

        if (response.errorCode) {
          // alertify.error(response.message);
        } else {
          // alertify.success("Role deleted successfully");
          onPageChange(currentPage);
        }
      })
      .catch(() => {
        // alertify.error("Error when trying to delete the role");
      });
  };

  const onRoleDelete = (role: Role) => {
    setToDeleteRole(role);
    setShowDelete(true);
  };

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Roles list</h1>

        <div>
          <Button onClick={() => setShowCreate(true)}>Create Role</Button>
        </div>
      </div>
      <hr />

      <RoleFormModal
        modalTitle="Create a Role"
        showModal={showCreate}
        onClose={() => setShowCreate(false)}
        onRoleSubmit={onRoleCreate}
        isLoading={isCreating}
      />

      <RoleFormModal
        defaultValue={toEditRole}
        modalTitle="Edit a Role"
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        onRoleSubmit={performEditRole}
        submitText="Edit role"
        isLoading={isEditing}
      />

      <RoleList
        items={roles}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onRoleEdit={onRoleEdit}
        onRoleDelete={onRoleDelete}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the role?"
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
