import { LanguageFormModal } from "@/UI/Components/LanguageFormModal";
import { LanguageList } from "@/UI/Components/LanguageList";
import { LanguageSearchForm } from "@/UI/Components/LanguageSearchForm";
import { withPageVisit } from "@variamosple/variamos-components";
import ConfirmationModal from "@variamosple/variamos-components/dist/Components/ConfirmationModal";
import { FC } from "react";
import { Container } from "react-bootstrap";
import { useLanguageList } from "./useLanguageList";

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
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to delete the language?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeleteLanguage(toDeleteLanguage!);
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeleteLanguage(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const LanguageListPage = withPageVisit(
  LanguageListPageComponent,
  "AdminLanguageList"
);
