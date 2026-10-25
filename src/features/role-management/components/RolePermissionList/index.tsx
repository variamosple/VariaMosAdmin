import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { ButtonGroup, Table } from "react-bootstrap";
import { TrashFill } from "react-bootstrap-icons";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import { IconButton } from "@/shared/components/IconButton";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";

export interface PermissionListParameters extends PaginationControlsProps {
  items: Permission[];
  state?: ListState;
  onPermissionDelete: (permission: Permission) => void;
}

export const RolePermissionList: FC<PermissionListParameters> = ({
  items,
  state,
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

      <Table aria-busy={state?.isLoading} striped bordered hover>
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
                    variant="danger"
                    onClick={() => onPermissionDelete(permission)}
                    label="Delete role permission"
                    icon={<TrashFill />}
                  />
                </ButtonGroup>
              </td>
            </tr>
          ))}
          {state && (
            <TableStateRow
              state={state}
              isEmpty={!items?.length}
              colSpan={3}
              items="permissions"
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
