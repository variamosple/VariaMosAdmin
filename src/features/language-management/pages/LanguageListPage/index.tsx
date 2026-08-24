import { withPageVisit } from "@variamosple/variamos-components";
import ConfirmationModal from "@variamosple/variamos-components/dist/Components/ConfirmationModal";
import type { FC } from "react";
import { Container } from "react-bootstrap";
import { LanguageFormModal } from "../../components/LanguageFormModal";
import { LanguageList } from "../../components/LanguageList";
import { LanguageSearchForm } from "../../components/LanguageSearchForm";
import { useLanguageList } from "../../hooks/useLanguageList";

const LanguageListPageComponent: FC = () => {
  const {
    languages,
    totalPages,
    currentPage,
    isLoading,
    onPageChange,
    onSearchReset,
    onSearchSubmit,
    onLanguageEdit,
    toEditLanguage,
    showEdit,
    setShowEdit,
    performEditLanguage,
    isEditing,
    onLanguageDelete,
    toDeleteLanguage,
    setToDeleteLanguage,
    showDelete,
    setShowDelete,
    showActivateConfirm,
    setShowActivateConfirm,
    showDeactivateConfirm,
    setShowDeactivateConfirm,
    toToggleLanguage,
    setToToggleLanguage,
    onLanguageActivateClick,
    onLanguageDeactivateClick,
    performDeleteLanguage,
  } = useLanguageList();

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Languages list</h1>
      <hr />

      <LanguageFormModal
        defaultValue={toEditLanguage}
        modalTitle="Edit a Language"
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        onLanguageSubmit={performEditLanguage}
        submitText="Edit language"
        isLoading={isEditing}
      />

      <LanguageSearchForm
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
      />

      <LanguageList
        items={languages}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLanguageEdit={onLanguageEdit}
        onLanguageDelete={onLanguageDelete}
        onLanguageActivate={onLanguageActivateClick}
        onLanguageDeactivate={onLanguageDeactivateClick}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the language?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeleteLanguage) {
            performDeleteLanguage(toDeleteLanguage);
          }
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeleteLanguage(undefined);
          setShowDelete(false);
        }}
      />

      <ConfirmationModal
        show={showActivateConfirm}
        message={`Are you sure you want to activate the language '${toToggleLanguage?.name || ""}'?`}
        confirmButtonVariant="success"
        onConfirm={() => {
          if (toToggleLanguage) {
            performEditLanguage({ ...toToggleLanguage, stateAccept: "ACTIVE" });
          }
          setShowActivateConfirm(false);
          setToToggleLanguage(undefined);
        }}
        onCancel={() => {
          setToToggleLanguage(undefined);
          setShowActivateConfirm(false);
        }}
      />

      <ConfirmationModal
        show={showDeactivateConfirm}
        message={`Are you sure you want to deactivate the language '${toToggleLanguage?.name || ""}'?`}
        confirmButtonVariant="warning"
        onConfirm={() => {
          if (toToggleLanguage) {
            performEditLanguage({
              ...toToggleLanguage,
              stateAccept: "PENDING",
            });
          }
          setShowDeactivateConfirm(false);
          setToToggleLanguage(undefined);
        }}
        onCancel={() => {
          setToToggleLanguage(undefined);
          setShowDeactivateConfirm(false);
        }}
      />
    </Container>
  );
};

export const LanguageListPage = withPageVisit(
  LanguageListPageComponent,
  "AdminLanguageList",
);
