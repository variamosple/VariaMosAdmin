import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Container } from "react-bootstrap";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { LanguageFormModal } from "../../components/LanguageFormModal";
import { LanguageList } from "../../components/LanguageList";
import { LanguageSearchForm } from "../../components/LanguageSearchForm";
import { useLanguageList } from "../../hooks/useLanguageList";

const LanguageListPageComponent: FC = () => {
  usePageTitle("Languages");
  const list = useLanguageList();
  const { toDeleteLanguage, toToggleLanguage } = list;

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Languages list</h1>
      <hr />

      <LanguageFormModal
        defaultValue={list.toEditLanguage}
        modalTitle="Edit a Language"
        showModal={list.showEdit}
        onClose={() => list.setShowEdit(false)}
        onLanguageSubmit={list.performEditLanguage}
        submitText="Edit language"
        isLoading={list.isEditing}
      />

      <LanguageSearchForm
        // A new form when the address changes by itself (UX-26)
        key={list.restoreKey}
        defaultFilter={list.restoredFilter ?? undefined}
        isLoading={list.isLoading}
        onSearchReset={list.onSearchReset}
        onSubmit={list.onSearchSubmit}
      />

      <LanguageList
        items={list.languages}
        state={list.listState}
        totalPages={list.totalPages}
        currentPage={list.currentPage}
        onPageChange={list.onPageChange}
        onLanguageEdit={list.onLanguageEdit}
        onLanguageDelete={list.onLanguageDelete}
        onLanguageActivate={list.onLanguageActivateClick}
        onLanguageDeactivate={list.onLanguageDeactivateClick}
      />

      <ConfirmationModal
        show={list.showDelete}
        title="Delete language"
        message={`Delete the language "${toDeleteLanguage?.name ?? ""}"?`}
        confirmLabel="Delete language"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeleteLanguage) {
            list.performDeleteLanguage(toDeleteLanguage);
          }
          list.setShowDelete(false);
        }}
        onCancel={() => {
          list.setToDeleteLanguage(undefined);
          list.setShowDelete(false);
        }}
      />

      <ConfirmationModal
        show={list.showActivateConfirm}
        title="Activate language"
        message={`Activate the language "${toToggleLanguage?.name ?? ""}"?`}
        confirmLabel="Activate language"
        confirmButtonVariant="success"
        onConfirm={() => {
          if (toToggleLanguage) {
            void list.performEditLanguage({
              ...toToggleLanguage,
              stateAccept: "ACTIVE",
            });
          }
          list.setShowActivateConfirm(false);
          list.setToToggleLanguage(undefined);
        }}
        onCancel={() => {
          list.setToToggleLanguage(undefined);
          list.setShowActivateConfirm(false);
        }}
      />

      <ConfirmationModal
        show={list.showDeactivateConfirm}
        title="Deactivate language"
        message={`Deactivate the language "${toToggleLanguage?.name ?? ""}"?`}
        confirmLabel="Deactivate language"
        confirmButtonVariant="warning"
        onConfirm={() => {
          if (toToggleLanguage) {
            void list.performEditLanguage({
              ...toToggleLanguage,
              stateAccept: "PENDING",
            });
          }
          list.setShowDeactivateConfirm(false);
          list.setToToggleLanguage(undefined);
        }}
        onCancel={() => {
          list.setToToggleLanguage(undefined);
          list.setShowDeactivateConfirm(false);
        }}
      />
    </Container>
  );
};

export const LanguageListPage = withPageVisit(
  LanguageListPageComponent,
  "AdminLanguageList",
);
