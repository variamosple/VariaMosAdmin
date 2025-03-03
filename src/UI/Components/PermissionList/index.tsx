import { Permission } from "@/Domain/Permission/Entity/Permission";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { Paginator } from "@variamosple/variamos-components";
import { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { PencilFill, TrashFill } from "react-bootstrap-icons";

export interface PermissionListParameters extends PaginationControlsProps {
  items: Permission[];
  onPermissionEdit: (permission: Permission) => void;
  onPermissionDelete: (permission: Permission) => void;
}

export const PermissionList: FC<PermissionListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onPermissionEdit,
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
                    variant="primary"
                    onClick={() => onPermissionEdit(permission)}
                    title="Edit permission"
                  >
                    <PencilFill />
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => onPermissionDelete(permission)}
                    title="Delete permission"
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
