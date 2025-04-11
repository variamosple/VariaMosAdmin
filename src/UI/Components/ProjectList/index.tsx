import { Project } from "@/Domain/Project/Project";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { Paginator } from "@variamosple/variamos-components";
import { FC } from "react";
import { Table } from "react-bootstrap";
import { ProjectRowComponent } from "./ProjectRow";

export interface ProjectListProps extends PaginationControlsProps {
  items: Project[];
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (project: Project) => void;
}

export const ProjectList: FC<ProjectListProps> = ({
  items,
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

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>

            <th>Description</th>

            <th>Author</th>

            <th>Source</th>

            <th>Date</th>

            <th>Access level</th>

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
