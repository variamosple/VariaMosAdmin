import { DialogErrorBoundary } from "@variamosple/variamos-components";
import type { ComponentType, FC } from "react";

/** How a dialog says that it is open, and closes. */
interface DialogState {
  show: boolean;
  onClose: () => void;
}

/**
 * The dialog, inside an error boundary of its own: an error thrown while it
 * renders stays in it, which says so, offers to report it and closes. The
 * page around keeps its input; without it, the boundary of the page would
 * replace the whole page (ADM-N53). The input of the dialog itself is lost:
 * it was in the part that failed.
 */
export const withDialogBoundary = <P extends object>(
  Dialog: ComponentType<P>,
  stateOf: (props: P) => DialogState,
): FC<P> => {
  const Bounded: FC<P> = (props) => {
    const { show, onClose } = stateOf(props);
    return (
      <DialogErrorBoundary show={show} onClose={onClose}>
        <Dialog {...props} />
      </DialogErrorBoundary>
    );
  };
  Bounded.displayName = `withDialogBoundary(${Dialog.displayName ?? Dialog.name})`;
  return Bounded;
};
