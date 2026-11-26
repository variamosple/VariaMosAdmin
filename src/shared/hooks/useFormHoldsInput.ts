import { isUnsavedInput } from "@variamosple/variamos-components";
import {
  type FieldValues,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";

/**
 * Whether a react-hook-form form holds unsaved input: its fields differ
 * from the values given to useForm or to the last reset, blanks aside
 * (isUnsavedInput of the components, the rule of every form).
 */
export const useFormHoldsInput = <TFields extends FieldValues>({
  control,
  formState,
}: Pick<UseFormReturn<TFields>, "control" | "formState">): boolean => {
  const fields = useWatch({ control });
  return isUnsavedInput(formState.defaultValues ?? {}, fields);
};
