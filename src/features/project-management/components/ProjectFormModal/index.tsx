import type { ResponseModel } from "@variamosple/variamos-components";
import { type FC, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";
import type { Project } from "@/features/project-management/domain/Entity/Project";

interface ProjectFormFields extends Omit<Project, "template"> {
  template?: string;
}

export interface ProjectFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Project;
  onProjectSubmit: (project: Project) => Promise<ResponseModel<Project>>;
  isLoading: boolean;
  submitText?: string;
}

export const ProjectFormModal: FC<ProjectFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onProjectSubmit,
  isLoading,
  submitText = "Edit Project",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormFields>();

  useEffect(() => {
    reset({
      ...defaultValue,
      template:
        defaultValue?.template !== undefined
          ? String(defaultValue.template)
          : "false",
    });
  }, [defaultValue, reset]);

  const onSubmit: SubmitHandler<ProjectFormFields> = (data) => {
    if (!isLoading) {
      let template = false;
      if (data?.template !== undefined && data?.template !== null) {
        template = String(data.template) === "true";
      } else if (defaultValue?.template !== undefined) {
        template = defaultValue.template;
      }

      const updatedProject: Project = {
        ...defaultValue,
        ...data,
        template,
      } as Project;

      onProjectSubmit(updatedProject).then((response) => {
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
              placeholder="Project name"
              {...register("name", { required: "Project name is required" })}
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="col-12" controlId="author">
            <Form.Label className="form-label">Access level</Form.Label>
            <Form.Select
              className="form-control"
              aria-label="Access level"
              {...register("template")}
            >
              <option value="false">Private</option>
              <option value="true">Public</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="col-12" controlId="author">
            <Form.Label className="form-label">Author</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              placeholder="Project author"
              {...register("author")}
            />
          </Form.Group>

          <Form.Group className="col-12" controlId="description">
            <Form.Label className="form-label">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="form-control"
              placeholder="Project description"
              {...register("description")}
            />
          </Form.Group>

          <Form.Group className="col-12" controlId="source">
            <Form.Label className="form-label">Source</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="form-control"
              placeholder="Project source"
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
