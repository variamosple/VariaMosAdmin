import { Role } from "@/Domain/Role/Entity/Role";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { PencilFill, Search, TrashFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { Paginator } from "../Paginator";

export interface RoleListParameters extends PaginationControlsProps {
  items: Role[];
  onRoleDelete: (role: Role) => void;
}

export const RoleList: FC<RoleListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onRoleDelete,
}) => {
  const navigate = useNavigate();
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
                    variant="secondary"
                    onClick={() => navigate(`/roles/${role.id}`)}
                    title="See role details"
                  >
                    <Search />
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => navigate(`/roles/${role.id}/edit`)}
                    title="Edit role"
                  >
                    <PencilFill />
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => onRoleDelete(role)}
                    title="Delete role"
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
