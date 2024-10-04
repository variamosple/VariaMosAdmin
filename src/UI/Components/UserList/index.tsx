import { User } from "@/Domain/User/Entity/User";
import { Paginator } from "@/UI/Components/Paginator";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { Ban, Search, TrashFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

export interface UserListParameters extends PaginationControlsProps {
  items: User[];
}

export const UserList: FC<UserListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const navigate = useNavigate();

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
            <tr key={user.id}>
              <td>{user.user}</td>

              <td>{user.name}</td>

              <td>{user.email}</td>

              <td>{user.isEnabled ? "active" : "disabled"}</td>

              <td>{new Date(user.createdAt)?.toISOString?.()}</td>

              <td>
                {user.lastLogin
                  ? new Date(user.lastLogin)?.toISOString?.()
                  : ""}
              </td>

              <td>
                <ButtonGroup size="sm">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/users/${user.id}`)}
                    title="See user details"
                  >
                    <Search />
                  </Button>

                  <Button
                    variant="warning"
                    onClick={() => {}}
                    title="Disable role"
                  >
                    <Ban />
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => {}}
                    title="Delete user"
                  >
                    <TrashFill />
                  </Button>
                </ButtonGroup>
              </td>
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
