import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { ButtonGroup, Table } from "react-bootstrap";
import { TrashFill } from "react-bootstrap-icons";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { IconButton } from "@/shared/components/IconButton";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";

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
                  <IconButton
                    variant="danger"
                    onClick={() => onRoleDelete(role)}
                    label="Delete user role"
                    icon={<TrashFill />}
                  />
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
