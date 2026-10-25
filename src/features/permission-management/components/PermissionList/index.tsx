import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { ButtonGroup, Table } from "react-bootstrap";
import { PencilFill, TrashFill } from "react-bootstrap-icons";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import { IconButton } from "@/shared/components/IconButton";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";

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
                  <IconButton
                    variant="primary"
                    onClick={() => onPermissionEdit(permission)}
                    label="Edit permission"
                    icon={<PencilFill />}
                  />

                  <IconButton
                    variant="danger"
                    onClick={() => onPermissionDelete(permission)}
                    label="Delete permission"
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
