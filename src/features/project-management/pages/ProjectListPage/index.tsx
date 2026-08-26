import { withPageVisit } from "@variamosple/variamos-components";
import ConfirmationModal from "@variamosple/variamos-components/dist/Components/ConfirmationModal";
import type { FC } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { ProjectFormModal } from "@/features/project-management/components/ProjectFormModal";
import { ProjectList } from "@/features/project-management/components/ProjectList";
import { ProjectSearchForm } from "@/features/project-management/components/ProjectsSearchForm";
import { useProjectList } from "../../hooks/useProjectsList";

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
    showCreate,
    setShowCreate,
    performCreateProject,
    isCreating,
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
      <Row className="align-items-center">
        <Col>
          <h1 className="mb-0">Projects list</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="me-1" /> Create Project
          </Button>
        </Col>
      </Row>
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

      <ProjectFormModal
        modalTitle="Create a Project"
        showModal={showCreate}
        onClose={() => setShowCreate(false)}
        onProjectSubmit={performCreateProject}
        submitText="Create project"
        isLoading={isCreating}
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
          if (toDeleteProject) {
            performDeleteProject(toDeleteProject);
          }
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
  "AdminProjectList",
);
