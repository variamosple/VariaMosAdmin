import { Role } from "@/Domain/Role/Entity/Role";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { TrashFill } from "react-bootstrap-icons";
import { Paginator } from "../Paginator";

export interface UserRoleListParameters extends PaginationControlsProps {
  items: Role[];
  onRoleDelete: (role: Role) => void;
}

export const UserRoleList: FC<UserRoleListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onRoleDelete,
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
            <th>ID</th>

            <th>Name</th>

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((role) => (
            <tr key={role.id}>
              <td>{role.id}</td>

              <td>{role.name}</td>

              <td>
                <ButtonGroup size="sm">
                  <Button
                    variant="danger"
                    onClick={() => onRoleDelete(role)}
                    title="Delete user role"
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
