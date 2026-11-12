import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Container } from "react-bootstrap";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { SearchForm } from "@/shared/components/SearchForm";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { UserList } from "../../components/UserList";
import { RecoveryLinkModal } from "../../components/UserList/RecoveryLinkModal";
import { useUserList } from "../../hooks/useUserList";

const UserListPageComponent: FC = () => {
  usePageTitle("Users");
  const list = useUserList();
  const { selectedUser } = list;

  return (
    <Container fluid="sm" className="my-2">
      <h1>Users list</h1>
      <hr />

      <SearchForm
        // A new form when the address changes by itself (UX-26)
        key={list.restoreKey}
        defaultSearch={list.restoredFilter?.search}
        isLoading={list.isLoading}
        onSearchReset={list.onSearchReset}
        onSubmit={list.onSearchSubmit}
        placeholder="Search by user name or email"
      />

      <UserList
        items={list.users}
        state={list.listState}
        totalPages={list.totalPages}
        currentPage={list.currentPage}
        onPageChange={list.onPageChange}
        sort={list.sort}
        onSort={list.onSort}
        onUserResetLink={list.onUserResetLink}
        onUserDisable={list.onUserDisable}
        onUserEnable={list.onUserEnable}
        onUserDelete={list.onUserDelete}
      />

      <RecoveryLinkModal
        show={list.showResetLink}
        onHide={() => list.setShowResetLink(false)}
        user={selectedUser}
      />

      <ConfirmationModal
        show={list.showDisable}
        title="Disable user"
        message={`Disable the account of "${selectedUser?.name ?? ""}"? The user can no longer sign in.`}
        confirmLabel="Disable user"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (selectedUser) {
            void list.performDisableUser(selectedUser);
          }
          list.setShowDisable(false);
        }}
        onCancel={() => {
          list.setSelectedUser(undefined);
          list.setShowDisable(false);
        }}
      />

      <ConfirmationModal
        show={list.showEnable}
        title="Enable user"
        message={`Enable the account of "${selectedUser?.name ?? ""}"?`}
        confirmLabel="Enable user"
        onConfirm={() => {
          if (selectedUser) {
            void list.performEnableUser(selectedUser);
          }
          list.setShowEnable(false);
        }}
        onCancel={() => {
          list.setSelectedUser(undefined);
          list.setShowEnable(false);
        }}
      />

      <ConfirmationModal
        show={list.showDelete}
        title="Delete user"
        message={`Delete the account of "${selectedUser?.name ?? ""}"?`}
        confirmLabel="Delete user"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (selectedUser) {
            void list.performDeleteUser(selectedUser);
          }
          list.setShowDelete(false);
        }}
        onCancel={() => {
          list.setSelectedUser(undefined);
          list.setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const UserListPage = withPageVisit(UserListPageComponent, "UserList");
