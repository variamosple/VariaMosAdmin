import { useDiscardConfirmation } from "@variamosple/variamos-components";
import { type FC, type ReactNode, type SubmitEventHandler, useId } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { ClosingFooter } from "./ClosingFooter";

export interface FormModalProps {
  title: string;
  show: boolean;
  isLoading: boolean;
  submitText: string;
  onClose: () => void;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  bodyClassName?: string;
  /** The fields hold unsaved input: closing asks first (UX-08). */
  holdsInput?: boolean;
  children: ReactNode;
}

/**
 * The frame of a creation or edit form in a modal: title, body, Cancel and
 * submit buttons. While saving, the modal cannot be closed and the submit
 * button shows a spinner. With unsaved input, every way of closing (close
 * button, Cancel, Escape, a click outside) asks before dropping it.
 */
export const FormModal: FC<FormModalProps> = ({
  title,
  show,
  isLoading,
  submitText,
  onClose,
  onSubmit,
  bodyClassName,
  holdsInput = false,
  children,
}) => {
  const titleId = useId();
  const closing = useDiscardConfirmation({
    holdsInput: show && holdsInput,
    onClose,
  });

  return (
    <Modal
      aria-labelledby={titleId}
      show={show}
      backdrop={isLoading ? "static" : true}
      keyboard={!isLoading}
      onHide={isLoading ? undefined : closing.requestClose}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title id={titleId}>{title}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit}>
        <Modal.Body className={bodyClassName}>{children}</Modal.Body>

        <ClosingFooter closing={closing}>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={closing.requestClose}
          >
            Cancel
          </Button>

          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <Spinner animation="border" variant="light" size="sm" />
            ) : (
              submitText
            )}
          </Button>
        </ClosingFooter>
      </Form>
    </Modal>
  );
};
