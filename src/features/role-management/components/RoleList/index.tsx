import { Paginator, useRouter } from "@variamosple/variamos-components";
import type { FC } from "react";
import { ButtonGroup, Table } from "react-bootstrap";
import { PencilFill, Search, TrashFill } from "react-bootstrap-icons";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import type { RoleSortField } from "@/features/role-management/domain/Entity/RolesFilter";
import { IconButton } from "@/shared/components/IconButton";
import { SortableHeader } from "@/shared/components/SortableHeader";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { ListSort } from "@/shared/domain/Entity/ListSort";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";

export interface RoleListParameters extends PaginationControlsProps {
  items: Role[];
  state?: ListState;
  onRoleEdit: (role: Role) => void;
  onRoleDelete: (role: Role) => void;
  sort?: ListSort<RoleSortField>;
  onSort?: (field: RoleSortField) => void;
}

export const RoleList: FC<RoleListParameters> = ({
  items,
  state,
  currentPage,
  totalPages,
  onPageChange,
  onRoleEdit,
  onRoleDelete,
  sort,
  onSort,
}) => {
  const { navigate } = useRouter();
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
            <SortableHeader field="id" label="ID" sort={sort} onSort={onSort} />

            <SortableHeader
              field="name"
              label="Name"
              sort={sort}
              onSort={onSort}
            />

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
                    variant="secondary"
                    onClick={() => navigate(`/roles/${role.id}`)}
                    label="See role details"
                    icon={<Search />}
                  />

                  <IconButton
                    variant="primary"
                    onClick={() => onRoleEdit(role)}
                    label="Edit role"
                    icon={<PencilFill />}
                  />

                  <IconButton
                    variant="danger"
                    onClick={() => onRoleDelete(role)}
                    label="Delete role"
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
