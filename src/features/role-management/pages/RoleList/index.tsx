import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Button, Container } from "react-bootstrap";
import { RoleFormModal } from "@/features/role-management/components/RoleFormModal";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { SearchForm } from "@/shared/components/SearchForm";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { RoleList } from "../../components/RoleList";
import { useRoleList } from "../../hooks/useRoleList";

const RoleListPageComponent: FC = () => {
  usePageTitle("Roles");
  const {
    restoredFilter,
    restoreKey,
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
    listState,
  } = useRoleList();

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Roles list</h1>

        <div>
          <Button onClick={() => setShowCreate(true)}>Create role</Button>
        </div>
      </div>
      <hr />

      <RoleFormModal
        modalTitle="New role"
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
        // A new form when the address changes by itself (UX-26)
        key={restoreKey}
        defaultSearch={restoredFilter?.name}
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
        placeholder="Search by role name"
      />

      <RoleList
        items={roles}
        state={listState}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onRoleEdit={onRoleEdit}
        onRoleDelete={onRoleDelete}
      />

      <ConfirmationModal
        show={showDelete}
        title="Delete role"
        message={`Delete the role "${toDeleteRole?.name ?? ""}"?`}
        confirmLabel="Delete role"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeleteRole) {
            performDeleteRole(toDeleteRole);
          }
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
