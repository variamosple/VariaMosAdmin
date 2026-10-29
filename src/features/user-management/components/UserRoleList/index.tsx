import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { ButtonGroup, Table } from "react-bootstrap";
import { TrashFill } from "react-bootstrap-icons";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { IconButton } from "@/shared/components/IconButton";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";

export interface UserRoleListParameters extends PaginationControlsProps {
  items: Role[];
  state?: ListState;
  onRoleDelete: (role: Role) => void;
}

export const UserRoleList: FC<UserRoleListParameters> = ({
  items,
  state,
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

      <Table aria-busy={state?.isLoading} striped bordered hover responsive>
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
          {state && (
            <TableStateRow
              state={state}
              isEmpty={!items?.length}
              colSpan={3}
              items="roles"
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
