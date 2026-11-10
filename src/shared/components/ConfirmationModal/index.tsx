import { useId } from "react";
import { Button, Modal } from "react-bootstrap";

export interface ConfirmationModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** The decision asked for, read first by screen readers: "Delete role" */
  title: string;
  /** Names the item concerned */
  message: string;
  /** The action itself, never a bare "Accept" (UX-15): "Delete role" */
  confirmLabel: string;
  confirmButtonVariant?: string;
  cancelLabel?: string;
  cancelButtonVariant?: string;
}

export default function ConfirmationModal({
  show,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmButtonVariant = "primary",
  cancelButtonVariant = "secondary",
  cancelLabel = "Cancel",
}: ConfirmationModalProps) {
  const titleId = useId();
  return (
    <Modal
      show={show}
      onHide={onCancel}
      animation={false}
      aria-labelledby={titleId}
    >
      <Modal.Header closeButton>
        <Modal.Title id={titleId} as="h2" className="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant={cancelButtonVariant} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={confirmButtonVariant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
