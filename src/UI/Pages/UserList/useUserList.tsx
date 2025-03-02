import {
  deleteUser,
  disableUser,
  enableUser,
  queryUsers,
} from "@/DataProviders/UserRepository";
import { User } from "@/Domain/User/Entity/User";
import { UsersFilter } from "@/Domain/User/Entity/UsersFilter";
import { useToast } from "@/UI/Context/ToastContext";
import { useEffect, useState } from "react";
import { usePaginatedQuery } from "variamos-components";

export const useUserList = () => {
  const [showEnable, setShowEnable] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User>();
  const { pushToast } = useToast();

  const {
    data: users,
    currentPage,
    loadData,
    totalPages,
    isLoading,
    onPageChange,
  } = usePaginatedQuery<UsersFilter, User>({
    queryFunction: queryUsers,
    initialFilter: new UsersFilter(),
  });

  useEffect(() => {
    loadData(new UsersFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "User query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  }, [loadData, pushToast]);

  const onUserDisable = (user: User) => {
    setSelectedUser(user);
    setShowDisable(true);
  };

  const performDisableUser = (user: User) => {
    pushToast({
      title: "User disable",
      message: "Disabling users...",
    });

    return disableUser(user.id!).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
        setShowDisable(false);
        pushToast({
          title: "User disable",
          message: "User disabled successfully",
          variant: "success",
        });
      } else {
        pushToast({
          title: "User disbale",
          message: response.message!,
          variant: "danger",
        });
      }

      return response;
    });
  };

  const onUserEnable = (user: User) => {
    setSelectedUser(user);
    setShowEnable(true);
  };

  const performEnableUser = (user: User) => {
    pushToast({
      title: "User enable",
      message: "Enabling users...",
    });

    return enableUser(user.id!).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
        setShowEnable(false);
        pushToast({
          title: "User enable",
          message: "User enabled successfully",
          variant: "success",
        });
      } else {
        pushToast({
          title: "User enable",
          message: response.message!,
          variant: "danger",
        });
      }

      return response;
    });
  };

  const onUserDelete = (user: User) => {
    setSelectedUser(user);
    setShowDelete(true);
  };

  const performDeleteUser = (user: User) => {
    return deleteUser(user.id!).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
        setShowDelete(false);
        pushToast({
          title: "User delete",
          message: "User deleted successfully",
          variant: "success",
        });
      } else {
        pushToast({
          title: "User delete",
          message: response.message!,
          variant: "danger",
        });
      }

      return response;
    });
  };

  const onSearchReset = () => {
    loadData(new UsersFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "User query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  const onSearchSubmit = (search?: string) => {
    loadData(new UsersFilter(undefined, undefined, search)).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "User query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  return {
    currentPage,
    onPageChange,
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
    onUserDisable,
    performDisableUser,
    onUserEnable,
    performEnableUser,
    onUserDelete,
    performDeleteUser,
    onSearchReset,
    onSearchSubmit,
  };
};
