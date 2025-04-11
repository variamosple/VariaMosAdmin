import { ProjectFormModal } from "@/UI/Components/ProjectFormModal";
import { ProjectList } from "@/UI/Components/ProjectList";
import { ProjectSearchForm } from "@/UI/Components/ProjectsSearchForm";
import { withPageVisit } from "@variamosple/variamos-components";
import ConfirmationModal from "@variamosple/variamos-components/dist/Components/ConfirmationModal";
import { FC } from "react";
import { Container } from "react-bootstrap";
import { useProjectList } from "./useProjectsList";

const ProjectListPageComponent: FC = () => {
  const {
    projects,
    totalPages,
    currentPage,
    isLoading,
    onPageChange,
    onSearchReset,
    onSearchSubmit,
    onProjectEdit,
    toEditProject,
    showEdit,
    setShowEdit,
    performEditProject,
    isEditing,
    onProjectDelete,
    toDeleteProject,
    setToDeleteProject,
    showDelete,
    setShowDelete,
    performDeleteProject,
  } = useProjectList();
  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Projects list</h1>
      <hr />

      <ProjectFormModal
        defaultValue={toEditProject}
        modalTitle="Edit a Project"
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        onProjectSubmit={performEditProject}
        submitText="Edit project"
        isLoading={isEditing}
      />

      <ProjectSearchForm
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
      />

      <ProjectList
        items={projects}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onProjectEdit={onProjectEdit}
        onProjectDelete={onProjectDelete}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the project?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeleteProject(toDeleteProject!);
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeleteProject(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const ProjectListPage = withPageVisit(
  ProjectListPageComponent,
  "AdminProjectList"
);
