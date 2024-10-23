import {
  disableUser,
  enableUser,
  queryUsers,
} from "@/DataProviders/UserRepository";
import { User } from "@/Domain/User/Entity/User";
import { UsersFilter } from "@/Domain/User/Entity/UsersFilter";
import { UserList } from "@/UI/Components/UserList";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { FC, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import ConfirmationModal from "../Components/ConfirmationModal";

export const UserListPage: FC<unknown> = () => {
  const [showEnable, setShowEnable] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const [toDisableUser, setToDisableUser] = useState<User>();
  const [toEnableUser, setToEnableUser] = useState<User>();

  const {
    data: users,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<UsersFilter, User>({
    queryFunction: queryUsers,
    initialFilter: new UsersFilter(),
  });

  useEffect(() => {
    loadData(new UsersFilter());
  }, [loadData]);

  const onUserDisable = (user: User) => {
    setToDisableUser(user);
    setShowDisable(true);
  };

  const performDisableUser = (user: User) => {
    return disableUser(user.id!).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
        setShowDisable(false);
      }

      return response;
    });
  };

  const onUserEnable = (user: User) => {
    setToEnableUser(user);
    setShowEnable(true);
  };

  const performEnableUser = (user: User) => {
    return enableUser(user.id!).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
        setShowEnable(false);
      }

      return response;
    });
  };

  return (
    <Container fluid="sm" className="my-2">
      <h1>Users list</h1>
      <hr />

      <ConfirmationModal
        show={showDisable}
        message="Are you sure you want to disable the user?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDisableUser(toDisableUser!);
          setShowDisable(false);
        }}
        onCancel={() => {
          setToDisableUser(undefined);
          setShowDisable(false);
        }}
      />

      <ConfirmationModal
        show={showEnable}
        message="Are you sure you want to enable the user?"
        onConfirm={() => {
          performEnableUser(toEnableUser!);
          setShowEnable(false);
        }}
        onCancel={() => {
          setToEnableUser(undefined);
          setShowEnable(false);
        }}
      />

      <UserList
        items={users}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onUserDisable={onUserDisable}
        onUserEnable={onUserEnable}
      />
    </Container>
  );
};
