import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Container } from "react-bootstrap";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { SearchForm } from "@/shared/components/SearchForm";
import { UserList } from "../../components/UserList";
import { RecoveryLinkModal } from "../../components/UserList/RecoveryLinkModal";
import { useUserList } from "../../hooks/useUserList";

const UserListPageComponent: FC = () => {
  const {
    showResetLink,
    setShowResetLink,
    showEnable,
    setShowEnable,
    showDisable,
    setShowDisable,
    showDelete,
    setShowDelete,
    selectedUser,
    setSelectedUser,
    users,
    totalPages,
    isLoading,
    onUserResetLink,
    onUserDisable,
    performDisableUser,
    onUserEnable,
    performEnableUser,
    onUserDelete,
    performDeleteUser,
    onSearchReset,
    onSearchSubmit,
    currentPage,
    onPageChange,
    listState,
  } = useUserList();

  return (
    <Container fluid="sm" className="my-2">
      <h1>Users list</h1>
      <hr />

      <SearchForm
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
        placeholder="Search by user name or email"
      />

      <UserList
        items={users}
        state={listState}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onUserResetLink={onUserResetLink}
        onUserDisable={onUserDisable}
        onUserEnable={onUserEnable}
        onUserDelete={onUserDelete}
      />

      <RecoveryLinkModal
        show={showResetLink}
        onHide={() => setShowResetLink(false)}
        user={selectedUser}
      />

      <ConfirmationModal
        show={showDisable}
        title="Disable user"
        message={`Disable the account of "${selectedUser?.name ?? ""}"? The user can no longer sign in.`}
        confirmLabel="Disable user"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (selectedUser) {
            performDisableUser(selectedUser);
          }
          setShowDisable(false);
        }}
        onCancel={() => {
          setSelectedUser(undefined);
          setShowDisable(false);
        }}
      />

      <ConfirmationModal
        show={showEnable}
        title="Enable user"
        message={`Enable the account of "${selectedUser?.name ?? ""}"?`}
        confirmLabel="Enable user"
        onConfirm={() => {
          if (selectedUser) {
            performEnableUser(selectedUser);
          }
          setShowEnable(false);
        }}
        onCancel={() => {
          setSelectedUser(undefined);
          setShowEnable(false);
        }}
      />

      <ConfirmationModal
        show={showDelete}
        title="Delete user"
        message={`Delete the account of "${selectedUser?.name ?? ""}"?`}
        confirmLabel="Delete user"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (selectedUser) {
            performDeleteUser(selectedUser);
          }
          setShowDelete(false);
        }}
        onCancel={() => {
          setSelectedUser(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const UserListPage = withPageVisit(UserListPageComponent, "UserList");
