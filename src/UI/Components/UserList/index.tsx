import { User } from "@/Domain/User/Entity/User";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Table } from "react-bootstrap";
import { Paginator } from "variamos-components";
import { UserRowComponent } from "./UserRow";

export interface UserListParameters extends PaginationControlsProps {
  items: User[];
  onUserDisable: (user: User) => void;
  onUserEnable: (user: User) => void;
  onUserDelete: (user: User) => void;
}

export const UserList: FC<UserListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
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

      <Table striped bordered hover>
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
              onUserDelete={onUserDelete}
              onUserDisable={onUserDisable}
              onUserEnable={onUserEnable}
            />
          ))}
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
