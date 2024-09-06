import { FC } from "react";
import { Table } from "react-bootstrap";
import { Role } from "../../../Domain/Role/Entity/Role";
import { PaginationControlsProps } from "../../HOC/WithPagination";
import { Paginator } from "../Paginator";

export interface RoleListParameters extends PaginationControlsProps {
  items: Role[];
}

export const RoleList: FC<RoleListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
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

              <td></td>
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
