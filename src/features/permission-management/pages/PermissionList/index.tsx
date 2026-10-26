import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Button, Container } from "react-bootstrap";
import { PermissionFormModal } from "@/features/permission-management/components/PermissionFormModal";
import { PermissionList } from "@/features/permission-management/components/PermissionList";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { SearchForm } from "@/shared/components/SearchForm";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { usePermissionList } from "../../hooks/usePermissionList";

const PermissionListPageComponent: FC = () => {
  usePageTitle("Permissions");
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
    toEditPermission,
    toDeletePermission,
    setToDeletePermission,
    permissions,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    onPermissionCreate,
    onPermissionEdit,
    performEditPermission,
    performDeletePermission,
    onPermissionDelete,
    onSearchReset,
    onSearchSubmit,
    listState,
  } = usePermissionList();

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Permissions list</h1>

        <div>
          <Button onClick={() => setShowCreate(true)}>Create permission</Button>
        </div>
      </div>
      <hr />

      <PermissionFormModal
        modalTitle="New permission"
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

      <SearchForm
        // A new form when the address changes by itself (UX-26)
        key={restoreKey}
        defaultSearch={restoredFilter?.name}
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
        placeholder="Search by permission name"
      />

      <PermissionList
        items={permissions}
        state={listState}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPermissionEdit={onPermissionEdit}
        onPermissionDelete={onPermissionDelete}
      />

      <ConfirmationModal
        show={showDelete}
        title="Delete permission"
        message={`Delete the permission "${toDeletePermission?.name ?? ""}"?`}
        confirmLabel="Delete permission"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeletePermission) {
            performDeletePermission(toDeletePermission);
          }
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

export const PermissionListPage = withPageVisit(
  PermissionListPageComponent,
  "PermissionList",
);
