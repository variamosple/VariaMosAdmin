import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import type { Project } from "@/features/project-management/domain/Entity/Project";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";
import { ProjectRowComponent } from "./ProjectRow";

export interface ProjectListProps extends PaginationControlsProps {
  items: Project[];
  state?: ListState;
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (project: Project) => void;
}

export const ProjectList: FC<ProjectListProps> = ({
  items,
  state,
  currentPage,
  totalPages,
  onPageChange,
  onProjectEdit,
  onProjectDelete,
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

            <th>Date</th>

            <th>Access level</th>

            <th>Status</th>

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((project) => (
            <ProjectRowComponent
              key={project.id}
              project={project}
              onProjectEdit={onProjectEdit}
              onProjectDelete={onProjectDelete}
            />
          ))}
          {state && (
            <TableStateRow
              state={state}
              isEmpty={!items?.length}
              colSpan={8}
              items="projects"
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
