import { User } from "@/Domain/User/Entity/User";
import { Paginator } from "@/UI/Components/Paginator";
import { formatDate } from "@/UI/constants";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { Ban, CheckCircle, Search, TrashFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

export interface UserListParameters extends PaginationControlsProps {
  items: User[];
  onUserDisable: (user: User) => void;
  onUserEnable: (user: User) => void;
}

export const UserList: FC<UserListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onUserDisable,
  onUserEnable,
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

              <td>{formatDate(new Date(user.createdAt))}</td>

              <td>
                {user.lastLogin ? formatDate(new Date(user.lastLogin)) : ""}
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

                  {user.isEnabled && (
                    <Button
                      variant="warning"
                      onClick={() => onUserDisable(user)}
                      title="Disable user"
                    >
                      <Ban />
                    </Button>
                  )}

                  {!user.isEnabled && (
                    <Button
                      variant="success"
                      onClick={() => onUserEnable(user)}
                      title="Enable user"
                    >
                      <CheckCircle />
                    </Button>
                  )}

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
