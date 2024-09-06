import { User } from "@/Domain/User/Entity/User";
import { Paginator } from "@/UI/Components/Paginator";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Table } from "react-bootstrap";

export interface UserListParameters extends PaginationControlsProps {
  items: User[];
}

export const UserList: FC<UserListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
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

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((user) => (
            <tr key={user.id}>
              <td>{user.user}</td>

              <td>{user.name}</td>

              <td>{user.email}</td>

              <td></td>
            </tr>
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
