import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Container } from "react-bootstrap";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { LanguageFormModal } from "../../components/LanguageFormModal";
import { LanguageList } from "../../components/LanguageList";
import { LanguageSearchForm } from "../../components/LanguageSearchForm";
import { useLanguageList } from "../../hooks/useLanguageList";

const LanguageListPageComponent: FC = () => {
  const {
    restoredFilter,
    restoreKey,
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
    listState,
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
        // A new form when the address changes by itself (UX-26)
        key={restoreKey}
        defaultFilter={restoredFilter ?? undefined}
        isLoading={isLoading}
        onSearchReset={onSearchReset}
        onSubmit={onSearchSubmit}
      />

      <LanguageList
        items={languages}
        state={listState}
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
        title="Delete language"
        message={`Delete the language "${toDeleteLanguage?.name ?? ""}"?`}
        confirmLabel="Delete language"
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
        title="Activate language"
        message={`Activate the language "${toToggleLanguage?.name ?? ""}"?`}
        confirmLabel="Activate language"
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
        title="Deactivate language"
        message={`Deactivate the language "${toToggleLanguage?.name ?? ""}"?`}
        confirmLabel="Deactivate language"
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
