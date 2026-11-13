import { type FC, type ReactNode, type SubmitEventHandler, useId } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

export interface FormModalProps {
  title: string;
  show: boolean;
  isLoading: boolean;
  submitText: string;
  onClose: () => void;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * The frame of a creation or edit form in a modal: title, body, Cancel and
 * submit buttons. While saving, the modal cannot be closed and the submit
 * button shows a spinner.
 */
export const FormModal: FC<FormModalProps> = ({
  title,
  show,
  isLoading,
  submitText,
  onClose,
  onSubmit,
  bodyClassName,
  children,
}) => {
  const titleId = useId();

  return (
    <Modal
      aria-labelledby={titleId}
      show={show}
      backdrop={isLoading ? "static" : true}
      onHide={onClose}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title id={titleId}>{title}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit}>
        <Modal.Body className={bodyClassName}>{children}</Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onClose}
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
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
