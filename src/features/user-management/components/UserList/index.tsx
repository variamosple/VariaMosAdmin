import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import type { User } from "@/features/user-management/domain/Entity/User";
import type { UserSortField } from "@/features/user-management/domain/Entity/UsersFilter";
import { SortableHeader } from "@/shared/components/SortableHeader";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { ListSort } from "@/shared/domain/Entity/ListSort";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";
import { UserRowComponent } from "./UserRow";

export interface UserListParameters extends PaginationControlsProps {
  items: User[];
  state?: ListState;
  onUserResetLink: (user: User) => void;
  onUserDisable: (user: User) => void;
  onUserEnable: (user: User) => void;
  onUserDelete: (user: User) => void;
  sort?: ListSort<UserSortField>;
  onSort?: (field: UserSortField) => void;
}

export const UserList: FC<UserListParameters> = ({
  items,
  state,
  currentPage,
  totalPages,
  onPageChange,
  onUserResetLink,
  onUserDisable,
  onUserEnable,
  onUserDelete,
  sort,
  onSort,
}) => {
  return (
    <>
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table aria-busy={state?.isLoading} striped bordered hover responsive>
        <thead>
          <tr>
            <SortableHeader
              field="user"
              label="User"
              sort={sort}
              onSort={onSort}
            />

            <SortableHeader
              field="name"
              label="Name"
              sort={sort}
              onSort={onSort}
            />

            <SortableHeader
              field="email"
              label="Email"
              sort={sort}
              onSort={onSort}
            />

            <th>Status</th>

            <SortableHeader
              field="createdAt"
              label="Created At"
              sort={sort}
              onSort={onSort}
            />

            <SortableHeader
              field="lastLogin"
              label="Last Login"
              sort={sort}
              onSort={onSort}
            />

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((user) => (
            <UserRowComponent
              key={user.id}
              user={user}
              onUserResetLink={onUserResetLink}
              onUserDelete={onUserDelete}
              onUserDisable={onUserDisable}
              onUserEnable={onUserEnable}
            />
          ))}
          {state && (
            <TableStateRow
              state={state}
              isEmpty={!items?.length}
              colSpan={7}
              items="users"
            />
          )}
        </tbody>
      </Table>

      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};
