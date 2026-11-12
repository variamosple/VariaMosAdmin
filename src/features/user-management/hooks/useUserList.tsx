import type { ResponseModel } from "@variamosple/variamos-components";
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
  keptSort,
  type ListSort,
  nextSort,
  readSort,
  shownSort,
} from "@/shared/domain/Entity/ListSort";
import { useListChange } from "@/shared/hooks/useListChange";
import {
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const usersFromParams = (params: URLSearchParams) => {
  const { sortBy, sortOrder } = readSort(params, USER_SORT_FIELDS);
  return new UsersFilter({
    search: readParam(params, "search"),
    pageNumber: readPage(params),
    sortBy,
    sortOrder,
  });
};

// The dialogs of the page, all about the selected user
const useUserDialogs = () => {
  const [showResetLink, setShowResetLink] = useState(false);
  const [showEnable, setShowEnable] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User>();

  const opening = (setShow: (show: boolean) => void) => (user: User) => {
    setSelectedUser(user);
    setShow(true);
  };

  return {
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
    onUserResetLink: opening(setShowResetLink),
    onUserEnable: opening(setShowEnable),
    onUserDisable: opening(setShowDisable),
    onUserDelete: opening(setShowDelete),
  };
};

type UserDialogs = ReturnType<typeof useUserDialogs>;

interface AccountChange {
  title: string;
  // Shown while the request runs
  pending?: string;
  success: string;
  failure: string;
  request: (userId: string) => Promise<ResponseModel<void>>;
  close: () => void;
}

const useUserChanges = (dialogs: UserDialogs, refresh: () => void) => {
  const { pushToast } = useToast();
  const run = useListChange(refresh);

  const change = (user: User, account: AccountChange) => {
    const { id } = user;
    const { title } = account;
    if (!id) {
      pushToast({ title, message: "User ID is missing", variant: "danger" });
      return Promise.reject(new Error("User ID is missing"));
    }
    if (account.pending) pushToast({ title, message: account.pending });
    return run({
      request: () => account.request(id),
      messages: { title, success: account.success, failure: account.failure },
      onSuccess: account.close,
    });
  };

  return {
    performDisableUser: (user: User) =>
      change(user, {
        title: "User disable",
        pending: "Disabling user...",
        success: "User disabled successfully",
        failure: "Failed to disable user",
        request: disableUser,
        close: () => dialogs.setShowDisable(false),
      }),
    performEnableUser: (user: User) =>
      change(user, {
        title: "User enable",
        pending: "Enabling user...",
        success: "User enabled successfully",
        failure: "Failed to enable user",
        request: enableUser,
        close: () => dialogs.setShowEnable(false),
      }),
    performDeleteUser: (user: User) =>
      change(user, {
        title: "User delete",
        success: "User deleted successfully",
        failure: "Failed to delete user",
        request: deleteUser,
        close: () => dialogs.setShowDelete(false),
      }),
  };
};

// The search keeps the sort, and the sort keeps the search
const useUserSearch = (
  filter: UsersFilter | null,
  loadData: (filter: UsersFilter) => Promise<ResponseModel<User[]>>,
) => {
  const usersFilter = (search?: string, wantedSort?: ListSort<UserSortField>) =>
    new UsersFilter({ search, ...keptSort(filter, wantedSort) });

  const sort = shownSort(filter, "name");
  return {
    sort,
    onSort: (field: UserSortField) => {
      void loadData(usersFilter(filter?.search, nextSort(sort, field)));
    },
    onSearchReset: () => {
      void loadData(usersFilter());
    },
    onSearchSubmit: (search?: string) => {
      void loadData(usersFilter(search));
    },
  };
};

export const useUserList = () => {
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

  const dialogs = useUserDialogs();
  const changes = useUserChanges(dialogs, () => onPageChange(currentPage));

  return {
    restoredFilter,
    restoreKey,
    listState,
    currentPage,
    onPageChange,
    ...dialogs,
    users,
    totalPages,
    isLoading,
    ...changes,
    ...useUserSearch(filter, loadData),
  };
};
