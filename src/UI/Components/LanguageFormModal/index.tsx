import { Language } from "@/Domain/Language/Language";
import { ResponseModel } from "@variamosple/variamos-components";
import { FC, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface LanguageFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Language;
  onLanguageSubmit: (project: Language) => Promise<ResponseModel<Language>>;
  isLoading: boolean;
  submitText?: string;
}

export const LanguageFormModal: FC<LanguageFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onLanguageSubmit,
  isLoading,
  submitText = "Edit Language",
}) => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<Language>();

  useEffect(() => {
    reset({ ...defaultValue });
  }, [defaultValue, reset]);

  const onSubmit: SubmitHandler<Language> = (data) => {
    if (!isLoading) {
      onLanguageSubmit(data).then((response) => {
        if (!response.errorCode) {
          reset();
        }
      });
    }
  };

  const onCloseModal = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      show={showModal}
      backdrop={isLoading ? "static" : true}
      onHide={onCloseModal}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group className="col-12" controlId="name">
            <Form.Label className="form-label">Name</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              placeholder="Language name"
              {...register("name", { required: "Language name is required" })}
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="col-12" controlId="stateAccept">
            <Form.Label className="form-label">State</Form.Label>
            <Form.Select
              className="form-control"
              aria-label="State"
              {...register("stateAccept")}
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onCloseModal}
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
