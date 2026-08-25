import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import type { Model } from "@/features/model-management/domain/Entity/Model";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import { ModelRowComponent } from "./ModelRow";

export interface ModelListProps extends PaginationControlsProps {
  items: Model[];
  onModelEdit: (model: Model) => void;
  onModelDelete: (model: Model) => void;
  onModelToggleLevel: (model: Model) => void;
  onModelToggleVisibility: (model: Model) => void;
}

export const ModelList: FC<ModelListProps> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onModelEdit,
  onModelDelete,
  onModelToggleLevel,
  onModelToggleVisibility,
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

            <th>Engineering Type</th>

            <th>Project</th>

            <th>Access level</th>

            <th>Level</th>

            <th>Status</th>

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
              onModelToggleLevel={onModelToggleLevel}
              onModelToggleVisibility={onModelToggleVisibility}
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
