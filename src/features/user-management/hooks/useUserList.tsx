import { useEffect, useState } from "react";
import {
  deleteUser,
  disableUser,
  enableUser,
  queryUsers,
} from "@/features/user-management/api/UserRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import { UsersFilter } from "@/features/user-management/domain/Entity/UsersFilter";
import { useToast } from "@/shared/context/ToastContext";
import { usePagedList } from "@/shared/hooks/usePagedList";

export const useUserList = () => {
  const [showResetLink, setShowResetLink] = useState(false);
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
    listState,
  } = usePagedList<UsersFilter, User>({
    queryFunction: queryUsers,
    initialFilter: new UsersFilter(),
  });

  useEffect(() => {
    void loadData(new UsersFilter());
  }, [loadData]);

  const onUserResetLink = (user: User) => {
    setSelectedUser(user);
    setShowResetLink(true);
  };

  const onUserDisable = (user: User) => {
    setSelectedUser(user);
    setShowDisable(true);
  };

  const performDisableUser = (user: User) => {
    if (!user.id) {
      pushToast({
        title: "User disable",
        message: "User ID is missing",
        variant: "danger",
      });
      return Promise.reject(new Error("User ID is missing"));
    }

    pushToast({
      title: "User disable",
      message: "Disabling users...",
    });

    return disableUser(user.id).then((response) => {
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
          title: "User disable",
          message: response.message || "Failed to disable user",
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
    if (!user.id) {
      pushToast({
        title: "User enable",
        message: "User ID is missing",
        variant: "danger",
      });
      return Promise.reject(new Error("User ID is missing"));
    }

    pushToast({
      title: "User enable",
      message: "Enabling users...",
    });

    return enableUser(user.id).then((response) => {
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
          message: response.message || "Failed to enable user",
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
    if (!user.id) {
      pushToast({
        title: "User delete",
        message: "User ID is missing",
        variant: "danger",
      });
      return Promise.reject(new Error("User ID is missing"));
    }

    return deleteUser(user.id).then((response) => {
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
          message: response.message || "Failed to delete user",
          variant: "danger",
        });
      }

      return response;
    });
  };

  const onSearchReset = () => {
    void loadData(new UsersFilter());
  };

  const onSearchSubmit = (search?: string) => {
    void loadData(new UsersFilter(undefined, undefined, search));
  };

  return {
    listState,
    currentPage,
    onPageChange,
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
  };
};
