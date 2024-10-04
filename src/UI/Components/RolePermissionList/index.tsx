import { Permission } from "@/Domain/Permission/Entity/Permission";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { TrashFill } from "react-bootstrap-icons";
import { Paginator } from "../Paginator";

export interface PermissionListParameters extends PaginationControlsProps {
  items: Permission[];
  onPermissionDelete: (permission: Permission) => void;
}

export const RolePermissionList: FC<PermissionListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onPermissionDelete,
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
          {items?.map((permission) => (
            <tr key={permission.id}>
              <td>{permission.id}</td>

              <td>{permission.name}</td>

              <td>
                <ButtonGroup size="sm">
                  <Button
                    variant="danger"
                    onClick={() => onPermissionDelete(permission)}
                    title="Delete role permission"
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
