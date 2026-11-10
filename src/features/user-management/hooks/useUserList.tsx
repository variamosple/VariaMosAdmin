import { useState } from "react";
import {
  deleteUser,
  disableUser,
  enableUser,
  queryUsers,
} from "@/features/user-management/api/UserRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import {
  USER_SORT_FIELDS,
  type UserSortField,
  UsersFilter,
} from "@/features/user-management/domain/Entity/UsersFilter";
import { useToast } from "@/shared/context/ToastContext";
import {
  type ListSort,
  nextSort,
  readSort,
  sortFields,
} from "@/shared/domain/Entity/ListSort";
import {
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const usersFromParams = (params: URLSearchParams) => {
  const { sortBy, sortOrder } = readSort(params, USER_SORT_FIELDS);
  return new UsersFilter(
    undefined,
    undefined,
    readParam(params, "search"),
    readPage(params),
    undefined,
    sortBy,
    sortOrder,
  );
};

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
    filter,
    totalPages,
    isLoading,
    onPageChange,
    listState,
  } = usePagedList<UsersFilter, User>({
    queryFunction: queryUsers,
    initialFilter: new UsersFilter(),
  });

  const { restoredFilter, restoreKey } = useListQueryState(
    { filter, currentPage, loadData },
    usersFromParams,
  );

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
      message: "Disabling user...",
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
      message: "Enabling user...",
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

  // The search keeps the sort, and the sort keeps the search
  const usersFilter = (search?: string, sort?: ListSort<UserSortField>) => {
    const { sortBy, sortOrder } = sort
      ? sortFields(sort)
      : { sortBy: filter?.sortBy, sortOrder: filter?.sortOrder };
    return new UsersFilter(
      undefined,
      undefined,
      search,
      undefined,
      undefined,
      sortBy,
      sortOrder,
    );
  };

  const onSearchReset = () => {
    void loadData(usersFilter());
  };

  const onSearchSubmit = (search?: string) => {
    void loadData(usersFilter(search));
  };

  const sort: ListSort<UserSortField> = {
    by: filter?.sortBy ?? "name",
    order: filter?.sortOrder ?? "asc",
  };
  const onSort = (field: UserSortField) => {
    void loadData(usersFilter(filter?.search, nextSort(sort, field)));
  };

  return {
    restoredFilter,
    restoreKey,
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
    sort,
    onSort,
    onSearchSubmit,
  };
};
