import { useState } from "react";
import { useToast } from "@/shared/context/ToastContext";
import {
  readPage,
  readParam,
  useListQueryState,
} from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";

// The list shown by the address (UX-26)
const languagesFromParams = (params: URLSearchParams) =>
  new LanguagesFilter(
    readParam(params, "name"),
    readParam(params, "status"),
    readPage(params),
  );

import { queryLanguages, updateLanguage } from "../api/LanguageRepository";
import { type Language, LanguageStatus } from "../domain/Entity/Language";
import { LanguagesFilter } from "../domain/Entity/LanguageFilter";

export const useLanguageList = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditLanguage, setToEditLanguage] = useState<Language>();
  const [toDeleteLanguage, setToDeleteLanguage] = useState<Language>();
  const [toToggleLanguage, setToToggleLanguage] = useState<Language>();
  const { pushToast } = useToast();

  const {
    data: languages,
    currentPage,
    loadData,
    filter,
    isLoading,
    totalPages,
    onPageChange,
    listState,
  } = usePagedList<LanguagesFilter, Language>({
    queryFunction: queryLanguages,
    initialFilter: new LanguagesFilter(),
  });

  const { restoredFilter, restoreKey } = useListQueryState(
    { filter, currentPage, loadData },
    languagesFromParams,
  );

  const onLanguageEdit = (language: Language) => {
    setToEditLanguage(language);
    setShowEdit(true);
  };

  const onLanguageActivateClick = (language: Language) => {
    setToToggleLanguage(language);
    setShowActivateConfirm(true);
  };

  const onLanguageDeactivateClick = (language: Language) => {
    setToToggleLanguage(language);
    setShowDeactivateConfirm(true);
  };

  const performEditLanguage = (language: Partial<Language>) => {
    setIsEditing(true);
    return updateLanguage({
      id: language.id,
      name: language.name,
      stateAccept: language.stateAccept,
    })
      .then((response) => {
        if (!response.errorCode) {
          onPageChange(currentPage);
          setShowEdit(false);

          pushToast({
            title: "Language edit",
            message: "Language updated successfully",
            variant: "success",
          });
        } else {
          pushToast({
            title: "Language edit",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        }

        return response;
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  const performDeleteLanguage = (language: Language) => {
    pushToast({
      title: "Language delete",
      message: "Deleting language (soft delete)...",
    });

    if (language.id !== undefined) {
      updateLanguage({
        id: language.id,
        name: language.name,
        stateAccept: LanguageStatus.DELETED,
      }).then((response) => {
        if (response.errorCode) {
          pushToast({
            title: "Language delete",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        } else {
          pushToast({
            title: "Language delete",
            message: "Language deleted (soft delete) successfully",
            variant: "success",
          });
          onPageChange(currentPage);
        }
      });
    }
  };

  const onLanguageDelete = (language: Language) => {
    setToDeleteLanguage(language);
    setShowDelete(true);
  };

  const onSearchReset = () => {
    void loadData(new LanguagesFilter());
  };

  const onSearchSubmit = (search?: LanguagesFilter) => {
    void loadData(new LanguagesFilter(search?.name, search?.status));
  };

  return {
    restoredFilter,
    restoreKey,
    listState,
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    showActivateConfirm,
    setShowActivateConfirm,
    showDeactivateConfirm,
    setShowDeactivateConfirm,
    isEditing,
    toEditLanguage,
    toDeleteLanguage,
    setToDeleteLanguage,
    toToggleLanguage,
    setToToggleLanguage,
    languages,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    onLanguageEdit,
    onLanguageActivateClick,
    onLanguageDeactivateClick,
    performEditLanguage,
    performDeleteLanguage,
    onLanguageDelete,
    onSearchReset,
    onSearchSubmit,
  };
};
