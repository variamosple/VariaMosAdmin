import { FC } from "react";
import { Table } from "react-bootstrap";
import { Permission } from "../../../Domain/Permission/Entity/Permission";
import { PaginationControlsProps } from "../../HOC/WithPagination";
import { Paginator } from "../Paginator";

export interface PermissionListParameters extends PaginationControlsProps {
  items: Permission[];
}

export const PermissionList: FC<PermissionListParameters> = ({
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
          {items?.map((permission) => (
            <tr key={permission.id}>
              <td>{permission.id}</td>

              <td>{permission.name}</td>

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
