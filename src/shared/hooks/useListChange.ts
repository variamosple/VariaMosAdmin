import type { ResponseModel } from "@variamosple/variamos-components";
import { type ToastType, useToast } from "@/shared/context/ToastContext";

/** What the toast says once a change to a list item has ended. */
export interface ChangeMessages {
  title: string;
  success: string;
  // The title of a failure, when it is not the same
  failureTitle?: string;
  // Shown when the server gives no reason
  failure?: string;
}

/** The toast for the end of a change: the success, or the server's reason. */
export const resultToastOf = <T>(
  response: ResponseModel<T>,
  messages: ChangeMessages,
): Omit<ToastType, "id"> =>
  response.errorCode
    ? {
        title: messages.failureTitle ?? messages.title,
        message: response.message || (messages.failure ?? "An error occurred"),
        variant: "danger",
      }
    : { title: messages.title, message: messages.success, variant: "success" };

/** A change to an item of a list: create, edit, delete, enable... */
export interface ListChange<T> {
  request: () => Promise<ResponseModel<T>>;
  messages: ChangeMessages;
  // Once it succeeded, after the page is read again: close the dialog
  onSuccess?: () => void;
  // True while the request runs
  setBusy?: (isBusy: boolean) => void;
}

/**
 * Runs the changes to the items of a list: busy while one runs, the page
 * read again when it succeeds, and a toast that says how it ended.
 */
export const useListChange = (refresh: () => void) => {
  const { pushToast } = useToast();
  return <T>(change: ListChange<T>) => {
    change.setBusy?.(true);
    return change
      .request()
      .then((response) => {
        if (!response.errorCode) {
          refresh();
          change.onSuccess?.();
        }
        pushToast(resultToastOf(response, change.messages));
        return response;
      })
      .finally(() => change.setBusy?.(false));
  };
};
