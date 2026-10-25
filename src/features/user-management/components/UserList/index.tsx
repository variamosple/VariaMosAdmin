import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import type { User } from "@/features/user-management/domain/Entity/User";
import { TableStateRow } from "@/shared/components/TableStateRow";
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
}) => {
  return (
    <>
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table aria-busy={state?.isLoading} striped bordered hover>
        <thead>
          <tr>
            <th>user</th>

            <th>Name</th>

            <th>Email</th>

            <th>Status</th>

            <th>Created At</th>

            <th>Last Login</th>

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
