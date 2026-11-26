import {
  DiscardInputPrompt,
  type useDiscardConfirmation,
} from "@variamosple/variamos-components";
import type { FC, ReactNode } from "react";
import { Modal } from "react-bootstrap";

export interface ClosingFooterProps {
  /** The closing of the modal, from useDiscardConfirmation. */
  closing: ReturnType<typeof useDiscardConfirmation>;
  className?: string;
  /** The buttons of the modal, replaced by the question while it is asked. */
  children: ReactNode;
}

/**
 * The footer of a modal form: its buttons, or the question asked before
 * unsaved input is dropped (UX-08).
 */
export const ClosingFooter: FC<ClosingFooterProps> = ({
  closing,
  className,
  children,
}) => (
  <Modal.Footer className={className}>
    {closing.isConfirming ? (
      <DiscardInputPrompt
        onKeepEditing={closing.keepEditing}
        onDiscard={closing.discard}
      />
    ) : (
      children
    )}
  </Modal.Footer>
);
