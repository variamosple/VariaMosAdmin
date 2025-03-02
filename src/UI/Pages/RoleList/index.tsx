import ConfirmationModal from "@/UI/Components/ConfirmationModal";
import { RoleFormModal } from "@/UI/Components/RoleFormModal";
import { RoleList } from "@/UI/Components/RoleList";
import { SearchForm } from "@/UI/Components/SearchForm";
import { FC } from "react";
import { Button, Container } from "react-bootstrap";
import { withPageVisit } from "variamos-components";
import { useRoleList } from "./useRoleList";

const RoleListPageComponent: FC<unknown> = () => {
  const {
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
  } = useRoleList();

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

      <SearchForm
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
        placeholder="Search by role name"
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

export const RoleListPage = withPageVisit(RoleListPageComponent, "RoleList");
