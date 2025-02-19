import ConfirmationModal from "@/UI/Components/ConfirmationModal";
import { PermissionFormModal } from "@/UI/Components/PermissionFormModal";
import { PermissionList } from "@/UI/Components/PermissionList";
import { SearchForm } from "@/UI/Components/SearchForm";
import { FC } from "react";
import { Button, Container } from "react-bootstrap";
import { usePermissionList } from "./usePermissionList";

export const PermissionListPage: FC<unknown> = () => {
  const {
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
  } = usePermissionList();

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
        modalTitle="Create a Permission"
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
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
        placeholder="Search by permission name"
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
