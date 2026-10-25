import { Paginator, useRouter } from "@variamosple/variamos-components";
import type { FC } from "react";
import { ButtonGroup, Table } from "react-bootstrap";
import { PencilFill, Search, TrashFill } from "react-bootstrap-icons";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { IconButton } from "@/shared/components/IconButton";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";

export interface RoleListParameters extends PaginationControlsProps {
  items: Role[];
  onRoleEdit: (role: Role) => void;
  onRoleDelete: (role: Role) => void;
}

export const RoleList: FC<RoleListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onRoleEdit,
  onRoleDelete,
}) => {
  const { navigate } = useRouter();
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
