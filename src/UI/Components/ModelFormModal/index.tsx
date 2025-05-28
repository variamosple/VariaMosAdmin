import { Model } from "@/Domain/Model/Model";
import { ResponseModel } from "@variamosple/variamos-components";
import { FC, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface ModelFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Model;
  onModelSubmit: (project: Model) => Promise<ResponseModel<Model>>;
  isLoading: boolean;
  submitText?: string;
}

export const ModelFormModal: FC<ModelFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onModelSubmit,
  isLoading,
  submitText = "Edit Model",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Model>();

  useEffect(() => {
    reset({ ...defaultValue });
  }, [defaultValue, reset]);

  const onSubmit: SubmitHandler<Model> = (data) => {
    if (!isLoading) {
      onModelSubmit(data).then((response) => {
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
              placeholder="Model name"
              {...register("name", { required: "Model name is required" })}
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="col-12" controlId="author">
            <Form.Label className="form-label">Author</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              placeholder="Model author"
              {...register("author")}
            />
          </Form.Group>

          <Form.Group className="col-12" controlId="description">
            <Form.Label className="form-label">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="form-control"
              placeholder="Model description"
              {...register("description")}
            />
          </Form.Group>

          <Form.Group className="col-12" controlId="source">
            <Form.Label className="form-label">Source</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="form-control"
              placeholder="Model source"
              {...register("source")}
            />
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
