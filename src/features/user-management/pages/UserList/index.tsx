import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { RecoveryLinkModal } from "../../components/UserList/RecoveryLinkModal";
import { SearchForm } from "@/shared/components/SearchForm";
import { UserList } from "../../components/UserList";
import { withPageVisit } from "@variamosple/variamos-components";
import { FC } from "react";
import { Container } from "react-bootstrap";
import { useUserList } from "../../hooks/useUserList";

const UserListPageComponent: FC<unknown> = () => {
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
        user={selectedUser!}
      />

      <ConfirmationModal
        show={showDisable}
        message="Are you sure you want to disable the user?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDisableUser(selectedUser!);
          setShowDisable(false);
        }}
        onCancel={() => {
          setSelectedUser(undefined);
          setShowDisable(false);
        }}
      />

      <ConfirmationModal
        show={showEnable}
        message="Are you sure you want to enable the user?"
        onConfirm={() => {
          performEnableUser(selectedUser!);
          setShowEnable(false);
        }}
        onCancel={() => {
          setSelectedUser(undefined);
          setShowEnable(false);
        }}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the user?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeleteUser(selectedUser!);
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
