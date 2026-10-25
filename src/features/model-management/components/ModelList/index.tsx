import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import type { Model } from "@/features/model-management/domain/Entity/Model";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";
import { ModelRowComponent } from "./ModelRow";

export interface ModelListProps extends PaginationControlsProps {
  items: Model[];
  state?: ListState;
  onModelEdit: (model: Model) => void;
  onModelDelete: (model: Model) => void;
  onModelToggleLevel: (model: Model) => void;
  onModelToggleVisibility: (model: Model) => void;
}

export const ModelList: FC<ModelListProps> = ({
  items,
  state,
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

      <Table aria-busy={state?.isLoading} striped bordered hover responsive>
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
          {state && (
            <TableStateRow
              state={state}
              isEmpty={!items?.length}
              colSpan={10}
              items="models"
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
