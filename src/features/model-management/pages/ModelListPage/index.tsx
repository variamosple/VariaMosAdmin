import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { ModelFormModal } from "@/features/model-management/components/ModelFormModal";
import { ModelList } from "@/features/model-management/components/ModelList";
import { ModelSearchForm } from "@/features/model-management/components/ModelSearchForm";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useModelList } from "../../hooks/useModelList";

const ModelListPageComponent: FC = () => {
  usePageTitle("Models");
  const list = useModelList();
  const { toDeleteModel } = list;
  return (
    <Container fluid="sm" className="my-2">
      <Row className="align-items-center">
        <Col>
          <h1 className="mb-0">Models list</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => list.setShowCreate(true)}>
            <Plus className="me-1" /> Create model
          </Button>
        </Col>
      </Row>
      <hr />

      <ModelFormModal
        defaultValue={list.toEditModel}
        modalTitle="Edit a Model"
        showModal={list.showEdit}
        onClose={() => list.setShowEdit(false)}
        onModelSubmit={list.performEditModel}
        submitText="Edit model"
        isLoading={list.isEditing}
        projects={list.projects}
        languages={list.languages}
        onProjectSearch={list.searchProjects}
        onLanguageSearch={list.searchLanguages}
      />

      <ModelFormModal
        modalTitle="New model"
        showModal={list.showCreate}
        onClose={() => list.setShowCreate(false)}
        onModelSubmit={list.performCreateModel}
        submitText="Create model"
        isLoading={list.isCreating}
        projects={list.projects}
        languages={list.languages}
        onProjectSearch={list.searchProjects}
        onLanguageSearch={list.searchLanguages}
      />

      <ModelSearchForm
        // A new form when the address changes by itself (UX-26)
        key={list.restoreKey}
        defaultFilter={list.restoredFilter ?? undefined}
        isLoading={list.isLoading}
        onSearchReset={list.onSearchReset}
        onSubmit={list.onSearchSubmit}
      />

      <ModelList
        items={list.models}
        state={list.listState}
        totalPages={list.totalPages}
        currentPage={list.currentPage}
        onPageChange={list.onPageChange}
        onModelEdit={list.onModelEdit}
        onModelDelete={list.onModelDelete}
        onModelToggleLevel={list.onModelToggleLevel}
        onModelToggleVisibility={list.onModelToggleVisibility}
      />

      <ConfirmationModal
        show={list.showDelete}
        title="Delete model"
        message={`Delete the model "${toDeleteModel?.name ?? ""}"?`}
        confirmLabel="Delete model"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeleteModel) {
            list.performDeleteModel(toDeleteModel);
          }
          list.setShowDelete(false);
        }}
        onCancel={() => {
          list.setToDeleteModel(undefined);
          list.setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const ModelListPage = withPageVisit(
  ModelListPageComponent,
  "AdminModelList",
);
