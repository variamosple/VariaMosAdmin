import { withPageVisit } from "@variamosple/variamos-components";
import ConfirmationModal from "@variamosple/variamos-components/dist/Components/ConfirmationModal";
import type { FC } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { ModelFormModal } from "@/features/model-management/components/ModelFormModal";
import { ModelList } from "@/features/model-management/components/ModelList";
import { ModelSearchForm } from "@/features/model-management/components/ModelSearchForm";
import { useModelList } from "../../hooks/useModelList";

const ModelListPageComponent: FC = () => {
  const {
    models,
    totalPages,
    currentPage,
    isLoading,
    onPageChange,
    onSearchReset,
    onSearchSubmit,
    onModelEdit,
    toEditModel,
    showEdit,
    setShowEdit,
    showCreate,
    setShowCreate,
    performCreateModel,
    isCreating,
    performEditModel,
    isEditing,
    onModelDelete,
    toDeleteModel,
    setToDeleteModel,
    showDelete,
    setShowDelete,
    performDeleteModel,
    onModelToggleLevel,
    onModelToggleVisibility,
    projects,
    languages,
  } = useModelList();
  return (
    <Container fluid="sm" className="my-2">
      <Row className="align-items-center">
        <Col>
          <h1 className="mb-0">Models list</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="me-1" /> Create Model
          </Button>
        </Col>
      </Row>
      <hr />

      <ModelFormModal
        defaultValue={toEditModel}
        modalTitle="Edit a Model"
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        onModelSubmit={performEditModel}
        submitText="Edit model"
        isLoading={isEditing}
        projects={projects}
        languages={languages}
      />

      <ModelFormModal
        modalTitle="Create a Model"
        showModal={showCreate}
        onClose={() => setShowCreate(false)}
        onModelSubmit={performCreateModel}
        submitText="Create model"
        isLoading={isCreating}
        projects={projects}
        languages={languages}
      />

      <ModelSearchForm
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
      />

      <ModelList
        items={models}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onModelEdit={onModelEdit}
        onModelDelete={onModelDelete}
        onModelToggleLevel={onModelToggleLevel}
        onModelToggleVisibility={onModelToggleVisibility}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the model?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeleteModel) {
            performDeleteModel(toDeleteModel);
          }
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeleteModel(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const ModelListPage = withPageVisit(
  ModelListPageComponent,
  "AdminModelList",
);
