import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import {
  CaretDownFill,
  CaretUpFill,
  PencilFill,
  TrashFill,
} from "react-bootstrap-icons";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import type {
  PermissionSortField,
  SortOrder,
} from "@/features/permission-management/domain/Entity/PermissionsFilter";
import { IconButton } from "@/shared/components/IconButton";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";

export interface PermissionListParameters extends PaginationControlsProps {
  items: Permission[];
  state?: ListState;
  onPermissionEdit: (permission: Permission) => void;
  onPermissionDelete: (permission: Permission) => void;
  sort?: { by: PermissionSortField; order: SortOrder };
  onSort?: (field: PermissionSortField) => void;
}

const SortableHeader: FC<{
  field: PermissionSortField;
  label: string;
  sort?: { by: PermissionSortField; order: SortOrder };
  onSort?: (field: PermissionSortField) => void;
}> = ({ field, label, sort, onSort }) => {
  if (!onSort) return <th>{label}</th>;
  const order = sort?.by === field ? sort.order : undefined;
  return (
    <th
      aria-sort={
        order === "asc" ? "ascending" : order === "desc" ? "descending" : "none"
      }
    >
      <Button
        variant="link"
        className="p-0 fw-bold text-reset text-decoration-none"
        onClick={() => onSort(field)}
      >
        {label}
        {order === "asc" && <CaretUpFill className="ms-1" aria-hidden />}
        {order === "desc" && <CaretDownFill className="ms-1" aria-hidden />}
      </Button>
    </th>
  );
};

export const PermissionList: FC<PermissionListParameters> = ({
  items,
  state,
  currentPage,
  totalPages,
  onPageChange,
  onPermissionEdit,
  onPermissionDelete,
  sort,
  onSort,
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
