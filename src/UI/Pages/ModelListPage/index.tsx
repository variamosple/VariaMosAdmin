import { ModelFormModal } from "@/UI/Components/ModelFormModal";
import { ModelList } from "@/UI/Components/ModelList";
import { ModelSearchForm } from "@/UI/Components/ModelSearchForm";
import { withPageVisit } from "@variamosple/variamos-components";
import ConfirmationModal from "@variamosple/variamos-components/dist/Components/ConfirmationModal";
import { FC } from "react";
import { Container } from "react-bootstrap";
import { useModelList } from "./useModelList";

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
    performEditModel,
    isEditing,
    onModelDelete,
    toDeleteModel,
    setToDeleteModel,
    showDelete,
    setShowDelete,
    performDeleteModel,
  } = useModelList();
  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Models list</h1>
      <hr />

      <ModelFormModal
        defaultValue={toEditModel}
        modalTitle="Edit a Model"
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        onModelSubmit={performEditModel}
        submitText="Edit model"
        isLoading={isEditing}
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
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the model?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeleteModel(toDeleteModel!);
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
  "AdminModelList"
);
