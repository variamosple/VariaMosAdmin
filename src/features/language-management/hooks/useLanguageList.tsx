import { useState } from "react";
import { useToast } from "@/shared/context/ToastContext";
import { useListChange } from "@/shared/hooks/useListChange";
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

// The dialogs of the page, and the language each one is about
const useLanguageDialogs = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toEditLanguage, setToEditLanguage] = useState<Language>();
  const [toDeleteLanguage, setToDeleteLanguage] = useState<Language>();
  const [toToggleLanguage, setToToggleLanguage] = useState<Language>();

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
  const onLanguageDelete = (language: Language) => {
    setToDeleteLanguage(language);
    setShowDelete(true);
  };

  return {
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    showActivateConfirm,
    setShowActivateConfirm,
    showDeactivateConfirm,
    setShowDeactivateConfirm,
    isEditing,
    setIsEditing,
    toEditLanguage,
    toDeleteLanguage,
    setToDeleteLanguage,
    toToggleLanguage,
    setToToggleLanguage,
    onLanguageEdit,
    onLanguageActivateClick,
    onLanguageDeactivateClick,
    onLanguageDelete,
  };
};

type LanguageDialogs = ReturnType<typeof useLanguageDialogs>;

const useLanguageChanges = (dialogs: LanguageDialogs, refresh: () => void) => {
  const { pushToast } = useToast();
  const run = useListChange(refresh);

  const performEditLanguage = (language: Partial<Language>) =>
    run({
      request: () =>
        updateLanguage({
          id: language.id,
          name: language.name,
          stateAccept: language.stateAccept,
        }),
      messages: {
        title: "Language edit",
        success: "Language updated successfully",
      },
      onSuccess: () => dialogs.setShowEdit(false),
      setBusy: dialogs.setIsEditing,
    });

  // A language is kept, marked as deleted
  const performDeleteLanguage = (language: Language) => {
    pushToast({
      title: "Language delete",
      message: "Deleting language (soft delete)...",
    });
    if (language.id === undefined) return;
    void run({
      request: () =>
        updateLanguage({
          id: language.id,
          name: language.name,
          stateAccept: LanguageStatus.DELETED,
        }),
      messages: {
        title: "Language delete",
        success: "Language deleted (soft delete) successfully",
      },
    });
  };

  return { performEditLanguage, performDeleteLanguage };
};

export const useLanguageList = () => {
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

  const { setIsEditing, ...dialogs } = useLanguageDialogs();
  const changes = useLanguageChanges({ ...dialogs, setIsEditing }, () =>
    onPageChange(currentPage),
  );

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
    ...dialogs,
    languages,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    ...changes,
    onSearchReset,
    onSearchSubmit,
  };
};
