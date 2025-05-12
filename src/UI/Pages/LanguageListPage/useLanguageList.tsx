import {
  deleteLanguage,
  queryLanguages,
  updateLanguage,
} from "@/DataProviders/LanguageRepository";
import { Language } from "@/Domain/Language/Language";
import { LanguagesFilter } from "@/Domain/Language/LanguageFilter";
import { useToast } from "@/UI/Context/ToastContext";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { useEffect, useState } from "react";

export const useLanguageList = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toEditLanguage, setToEditLanguage] = useState<Language>();
  const [toDeleteLanguage, setToDeleteLanguage] = useState<Language>();
  const { pushToast } = useToast();

  const {
    data: languages,
    currentPage,
    loadData,
    isLoading,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<LanguagesFilter, Language>({
    queryFunction: queryLanguages,
    initialFilter: new LanguagesFilter(),
  });

  useEffect(() => {
    loadData(new LanguagesFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Language query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  }, [loadData, pushToast]);

  const onLanguageEdit = (language: Language) => {
    setToEditLanguage(language);
    setShowEdit(true);
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
            message: response.message!,
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
      message: "Deleting language...",
    });

    deleteLanguage(language.id!).then((response) => {
      // alertify.dismissAll();

      if (response.errorCode) {
        pushToast({
          title: "Language delete",
          message: response.message!,
          variant: "danger",
        });
      } else {
        pushToast({
          title: "Language delete",
          message: "Language deleted successfully",
          variant: "success",
        });
        onPageChange(currentPage);
      }
    });
  };

  const onLanguageDelete = (language: Language) => {
    setToDeleteLanguage(language);
    setShowDelete(true);
  };

  const onSearchReset = () => {
    loadData(new LanguagesFilter()).then((response) => {
      if (response.errorCode) {
        pushToast({
          title: "Language query error",
          message: response.message!,
          variant: "danger",
        });
      }
    });
  };

  const onSearchSubmit = (search?: LanguagesFilter) => {
    loadData(new LanguagesFilter(search?.name, search?.status)).then(
      (response) => {
        if (response.errorCode) {
          pushToast({
            title: "Language query error",
            message: response.message!,
            variant: "danger",
          });
        }
      }
    );
  };

  return {
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    isEditing,
    toEditLanguage,
    toDeleteLanguage,
    setToDeleteLanguage,
    languages,
    currentPage,
    isLoading,
    totalPages,
    onPageChange,
    onLanguageEdit,
    performEditLanguage,
    performDeleteLanguage,
    onLanguageDelete,
    onSearchReset,
    onSearchSubmit,
  };
};
