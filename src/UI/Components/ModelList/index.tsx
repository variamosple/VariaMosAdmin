import { Model } from "@/Domain/Model/Model";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { Paginator } from "@variamosple/variamos-components";
import { FC } from "react";
import { Table } from "react-bootstrap";
import { ModelRowComponent } from "./ModelRow";

export interface ModelListProps extends PaginationControlsProps {
  items: Model[];
  onModelEdit: (model: Model) => void;
  onModelDelete: (model: Model) => void;
}

export const ModelList: FC<ModelListProps> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onModelEdit,
  onModelDelete,
}) => {
  return (
    <>
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>

            <th>Description</th>

            <th>Author</th>

            <th>Source</th>

            <th>Level</th>

            <th>Project</th>

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((model) => (
            <ModelRowComponent
              key={model.id + model.projectId}
              model={model}
              onModelEdit={onModelEdit}
              onModelDelete={onModelDelete}
            />
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
