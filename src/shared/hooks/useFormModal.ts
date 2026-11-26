import type { ResponseModel } from "@variamosple/variamos-components";
import { useEffect } from "react";
import {
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import { useFormHoldsInput } from "./useFormHoldsInput";

interface FormModalOptions<TFields extends FieldValues, TItem, TSaved> {
  /** The item to edit, if any; the form is filled again when it changes. */
  defaultValue?: TItem;
  /** Form values for the item. Declare it outside the component: it must not change between renders. */
  toFields: (value?: TItem) => DefaultValues<TFields>;
  submit: (fields: TFields) => Promise<ResponseModel<TSaved>>;
  isLoading: boolean;
  onClose: () => void;
}

/**
 * The state of a form in a modal: filled from the edited item, brought back
 * to it (edits dropped) after a successful save or when the modal closes, and
 * never sent while a save is running. `holdsInput` says whether the fields
 * differ from the values the form was filled with (isUnsavedInput), for
 * FormModal.
 */
export const useFormModal = <
  TFields extends FieldValues,
  TItem,
  TSaved = TItem,
>({
  defaultValue,
  toFields,
  submit,
  isLoading,
  onClose,
}: FormModalOptions<TFields, TItem, TSaved>): {
  form: UseFormReturn<TFields>;
  onSubmit: ReturnType<UseFormReturn<TFields>["handleSubmit"]>;
  onCloseModal: () => void;
  holdsInput: boolean;
} => {
  const form = useForm<TFields>();
  const { reset, handleSubmit } = form;
  const holdsInput = useFormHoldsInput(form);

  useEffect(() => {
    reset(toFields(defaultValue));
  }, [defaultValue, reset, toFields]);

  const onSubmit = handleSubmit((fields) => {
    if (!isLoading) {
      void submit(fields).then((response) => {
        if (!response.errorCode) {
          reset();
        }
      });
    }
  });

  const onCloseModal = () => {
    onClose();
    reset();
  };

  return { form, onSubmit, onCloseModal, holdsInput };
};
